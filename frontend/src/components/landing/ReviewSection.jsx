import React, { useState, useEffect } from "react";
import { Star, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ReviewSection = () => {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      userName: "Mayur Gaikwad",
      comment: "It was really good .........................................",
      rating: 4,
      headline: "Really Nice",
    },
    {
      id: 2,
      userName: "Mayur Gaikwad",
      comment: "It was really good .........................................",
      rating: 4,
      headline: "Really Nice",
    },
  ]);
  const [newReview, setNewReview] = useState({
    userName: "",
    comment: "",
    rating: 0,
    headline: "",
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // In a real app, you would fetch reviews here
    // fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
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
      return { average: 4.9, total: 2, distribution: [0, 0, 50, 50, 0] };

    // Using hardcoded stats to match the image precisely if reviews are just 2
    return {
      average: 4.9,
      total: reviews.length,
      distribution: [0, 0, 50, 50, 0], // Excellent, Good, Average, Below Average, Poor
    };
  };

  const stats = calculateStats();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment || !newReview.headline) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newReview.rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      // Mocking submission
      setTimeout(() => {
        toast.success("Thank you for your feedback!");
        setNewReview({ userName: "", comment: "", rating: 0, headline: "" });
        setHoverRating(0);
        setShowForm(false);
        setSubmitting(false);
      }, 1000);
    } catch (error) {
      toast.error("An error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 bg-[#f0f9ff]">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <h2 className="text-brand-600 text-lg sm:text-xl md:text-2xl font-bold mb-8 md:mb-12 ml-2 text-center md:text-left">
          What customers are saying about
        </h2>

        {/* Summary Container */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-8 mb-10 md:mb-12 px-2 sm:px-4">
            {/* Left: Score */}
            <div className="flex flex-col items-center md:items-start">
              <div className="text-4xl sm:text-5xl md:text-6xl font-medium text-slate-800 mb-1">
                ({stats.average}/5)
              </div>
              <div className="text-base sm:text-lg text-slate-600 font-medium mb-3">
                {stats.total} Reviews
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6 sm:w-8 sm:h-8 fill-[#eab308] text-[#eab308]"
                  />
                ))}
              </div>
            </div>

            {/* Right: progress bars */}
            <div className="flex-1 max-w-lg w-full space-y-3">
              {[
                { label: "Excellent", percentage: 0 },
                { label: "Good", percentage: 0 },
                { label: "Average", percentage: 50 },
                { label: "Below Average", percentage: 50 },
                { label: "Poor", percentage: 0 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                  <div className="flex-1 h-3 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#eab308] rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-sm font-medium text-slate-700 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View all link */}
        <div className="flex justify-end mb-4 pr-2">
          <button className="text-sm font-bold text-black hover:underline">
            View all review
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 px-2 sm:px-0">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl sm:rounded-[1.5rem] p-6 sm:p-8 md:p-10 shadow-sm border border-white/20 h-full flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <span className="text-lg sm:text-xl font-medium text-slate-800">
                  {review.rating}
                </span>
                <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-[#fab005] text-[#fab005]" />
                <span className="text-lg sm:text-xl font-medium text-slate-800 ml-2 sm:ml-4 line-clamp-1">
                  {review.headline}
                </span>
              </div>
              <p className="text-slate-600 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg flex-grow">
                {review.comment}
              </p>
              <div className="text-slate-200 text-xl sm:text-2xl font-light mb-3 sm:mb-4 -mt-2 sm:-mt-4 opacity-50 overflow-hidden whitespace-nowrap">
                .................................................................
              </div>
              <div className="font-medium text-slate-800 text-base sm:text-lg">
                {review.userName}
              </div>
            </div>
          ))}
        </div>

        {/* Write a review button */}
        <div className="flex justify-center px-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-black text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl hover:bg-slate-900 transition-all shadow-2xl shadow-black/20"
          >
            Write a review
          </button>
        </div>

        {/* Form Overlay */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[32px] p-6 sm:p-10 pb-12 sm:pb-16 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 relative overflow-hidden max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-black hover:bg-slate-100 transition-all rounded-full p-2"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  Share your experience
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm sm:text-base">
                  We'd love to hear your feedback on our tool.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-[0.15em]">
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
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-9 h-9 sm:w-10 sm:h-10 transition-all ${
                            star <= (hoverRating || newReview.rating)
                              ? "fill-[#FFC107] text-[#FFC107] drop-shadow-[0_0_8px_rgba(255,193,7,0.3)]"
                              : "text-slate-100 fill-slate-100"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                      <input
                        type="text"
                        value={newReview.userName}
                        onChange={(e) =>
                          setNewReview({ ...newReview, userName: e.target.value })
                        }
                        className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-3 sm:py-4 text-slate-800 placeholder:text-slate-500 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-base font-medium"
                        placeholder="Your Name"
                        required
                      />
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        value={newReview.headline}
                        onChange={(e) =>
                          setNewReview({ ...newReview, headline: e.target.value })
                        }
                        className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-3 sm:py-4 text-slate-800 placeholder:text-slate-500 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all text-base font-medium"
                        placeholder="Headline"
                        required
                      />
                    </div>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className="w-full bg-slate-50/50 border-2 border-slate-50 rounded-2xl px-6 py-3 sm:py-4 text-slate-800 placeholder:text-slate-500 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none min-h-[100px] sm:min-h-[140px] resize-none transition-all text-base font-medium"
                      placeholder="Your review details..."
                      required
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full bg-black text-white font-bold h-14 sm:h-16 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all overflow-hidden active:scale-[0.98] shadow-xl"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <span className="relative z-10 text-lg">Submit Review</span>
                      <Send className="w-5 h-5 relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
