import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Send, User, Loader2 } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);

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
    <section className="min-h-screen flex items-center py-10 md:py-14 px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        {/* Heading Section */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="">
            What customers are saying about
          </h2>
          <h3 className="font-heading font-medium text-slate-600 mb-4">
            {/* Kernel OST to PST Converter */}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-2 text-brand-600 fill-brand-600">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < 4.9 ? "fill-current" : "text-slate-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-600">
              (4.9/5) {stats.total} Reviews
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side: Featured Review */}
          <div className="w-full">
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-3xl border border-slate-100">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] transition-all hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                {/* Decorative Accent */}
                <div className="absolute top-0 left-0 w-2 h-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <h4 className="mb-6 border-b border-slate-50 pb-4">
                  {reviews[0].comment.split(".")[0].length < 50
                    ? reviews[0].comment.split(".")[0]
                    : "Highly Recommended Tool"}
                </h4>

                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <User className="w-full h-full p-4 text-slate-400" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-slate-600 italic leading-relaxed text-[15px]">
                      "{reviews[0].comment}"
                    </p>
                    <div>
                      <h5 className="text-lg">
                        {reviews[0].userName}
                      </h5>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Verified Business User
                      </p>
                    </div>
                    <div className="flex gap-0.5 text-brand-600 fill-brand-600 pt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < reviews[0].rating ? "fill-current" : "text-brand-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-slate-100 text-brand-400 gap-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="font-medium">
                  No reviews yet. Be the first to share!
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Rating Distribution */}
          <div className="space-y-6 pt-4">
            {[
              { label: "Excellent", rating: 5 },
              { label: "Good", rating: 4 },
              { label: "Average", rating: 3 },
              { label: "Below Average", rating: 2 },
              { label: "Poor", rating: 1 },
            ].map((item) => {
              const count = stats.distribution[5 - item.rating];
              const percentage =
                stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={item.rating} className="flex items-center gap-4">
                  <span className="w-28 text-[13px] font-bold text-slate-500 text-right">
                    {item.label}
                  </span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-[13px] font-bold text-brand-600">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mt-12 md:mt-16">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-brand-600 font-bold text-[15px] hover:underline"
          >
            {showForm ? "Cancel review" : "Write a review"}
          </button>
          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-black px-10 h-14 rounded-full shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] text-md">
            View all reviews
          </Button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div
            id="review-form"
            className="mt-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-brand-600 mb-1">
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
                          className={`w-8 h-8 ${star <= (hoverRating || newReview.rating) ? "text-brand-600 fill-brand-600" : "text-slate-200 fill-slate-200"}`}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[120px] resize-none"
                    placeholder="Tell us about your experience..."
                    required
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition-all hover:shadow-brand-600/30"
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
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
