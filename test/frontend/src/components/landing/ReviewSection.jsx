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
    return { average, total: reviews.length, distribution };
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
    <section className="py-12 md:py-20 px-4 md:px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
        {/* Left side: Review List & Stats */}
        <div className="space-y-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Customer <span className="text-emerald-600">Reviews</span>
            </h2>
            <p className="text-slate-500 text-lg">
              See what our users are saying about their experience with our OST
              to PST converter.
            </p>
          </div>

          {/* New Stats Row */}
          {!loading && reviews.length > 0 && (
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-10 items-center md:items-start">
              <div className="text-center md:text-left space-y-2">
                <div className="text-6xl font-black text-slate-900">
                  {stats.average}
                </div>
                <div className="flex gap-1 justify-center md:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(stats.average) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  Based on {stats.total} reviews
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[5 - rating];
                  const percentage =
                    stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-4 group">
                      <div className="text-sm font-bold text-slate-600 w-3">
                        {rating}
                      </div>
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium text-slate-400 w-8 text-right">
                        {Math.round(percentage)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="h-auto max-h-[500px] w-full overflow-y-auto pr-2 no-scrollbar">
            <div className="space-y-6">
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
                    className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">
                            {review.userName}
                          </h4>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right side: Post Review Form */}
        <div className="bg-slate-800 rounded-3xl p-8 lg:p-12 text-white shadow-xl h-fit">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            Share Your Experience
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                value={newReview.userName}
                onChange={(e) =>
                  setNewReview({ ...newReview, userName: e.target.value })
                }
                className="w-full bg-slate-700 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= (hoverRating || newReview.rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">
                Your Feedback
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
                className="w-full bg-slate-700 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none min-h-[120px] resize-none"
                placeholder="Tell us what you think..."
                required
              ></textarea>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-900/40"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  Post Feedback
                  <Send className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
