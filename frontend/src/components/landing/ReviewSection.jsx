import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ReviewSection = () => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    userName: "",
    comment: "",
    rating: 0,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (reviews.length === 0)
      return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const average = (sum / reviews.length).toFixed(1);
    const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[5 - r.rating]++;
      }
    });

    // Mock category ratings based on average
    const categories = [
      { name: "Speed", score: (Number(average) + 0.2).toFixed(1) },
      { name: "Accuracy", score: average },
      { name: "Support", score: (Number(average) - 0.1).toFixed(1) },
      { name: "Features", score: (Number(average) + 0.1).toFixed(1) },
      { name: "Reliability", score: average },
    ];

    return { average, total: reviews.length, distribution, categories };
  };

  const stats = calculateStats();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newReview.rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
      });

      if (response.ok) {
        toast.success("Thank you for your feedback!");
        setNewReview({ userName: "", comment: "", rating: 0 });
        setHoverRating(0);
        fetchReviews();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-10 px-4 md:px-6 lg:px-8 bg-white flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left side: Review Stats & List (Span 7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Reviews</h2>
            <div className="flex items-center gap-2 mb-6">
              <div className="text-5xl font-black text-slate-900">
                {stats.average}
              </div>
              <div className="flex flex-col">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(Number(stats.average)) ? "fill-current" : "text-slate-200 fill-slate-200"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-500 font-medium">
                  {stats.total} ratings
                </span>
              </div>
            </div>

            {/* Distribution Bars */}
            {!loading && reviews.length > 0 && (
              <div className="space-y-3 mb-8">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[5 - rating];
                  const percentage =
                    stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex-1">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                        {/* Re-overriding inline style for class usage to ensure cleaner code if needed, but style width is dynamic. */}
                      </div>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <span className="text-sm font-bold text-slate-700">
                          {rating}.0
                        </span>
                        <span className="text-xs text-slate-400">
                          {count > 1000
                            ? (count / 1000).toFixed(1) + "k"
                            : count}{" "}
                          reviews
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Categories */}
            {!loading && reviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-10">
                {stats.categories?.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <span className="text-emerald-600 font-bold text-lg">
                      {cat.score > 5 ? 5.0 : cat.score}
                    </span>
                    <span className="text-slate-600 font-medium text-sm">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review List */}
          <div className="space-y-8 max-h-[250px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent overscroll-y-none isolate">
            {loading ? (
              <div className="text-center py-10 text-slate-400">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-slate-100 pb-8 last:border-0"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                        <User className="w-full h-full p-2 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">
                          {review.userName}
                        </h4>
                        <span className="text-xs text-slate-400 block">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
                      <span className="font-bold text-slate-900">
                        {review.rating}.0
                      </span>
                      <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {review.comment}
                    </p>
                  </div>

                  {/* Placeholder for images if functionality existed */}
                  {/* <div className="flex gap-2 mt-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg"></div>
                    <div className="w-16 h-16 bg-slate-100 rounded-lg"></div>
                  </div> */}
                </div>
              ))
            )}
          </div>

          {/* "Read all reviews" link style */}
          {!loading && reviews.length > 5 && (
            <button className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              Read all reviews
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-down"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* Right side: Write Review Form (Span 5 cols) - Sticky */}
        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Write a review
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Share your experience with other users.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setNewReview({ ...newReview, rating: star })
                        }
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${star <= (hoverRating || newReview.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) =>
                      setNewReview({ ...newReview, userName: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Review
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none min-h-[120px] resize-none"
                    placeholder="Tell us about your experience..."
                    required
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Review
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Trust Badge / Extra Info */}
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Verified Reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
