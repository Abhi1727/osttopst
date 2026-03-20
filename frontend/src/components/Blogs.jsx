import React, { useState } from "react";
import {
  Search,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Import images
import imgMigration from "../assets/blog/blog_email_migration_1772432378369.png";
import imgSecurity from "../assets/blog/blog_data_security_1772432391754.png";
import imgCloud from "../assets/blog/blog_cloud_storage_1772432410345.png";
import imgTrouble from "../assets/blog/blog_troubleshooting_1772432450252.png";

const CATEGORIES = [
  "All Posts",
  "Data Migration",
  "Security",
  "Best Practices",
  "Cloud Solutions",
  "Productivity",
  "Troubleshooting",
];

const CategoryPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer border ${
      active
        ? "bg-brand-600 text-white shadow-xl shadow-brand-100 border-brand-600 scale-105"
        : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600"
    }`}
  >
    {label}
  </button>
);

const BlogCard = ({ post, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col h-full cursor-pointer relative"
  >
    <div className="relative aspect-video overflow-hidden m-3 rounded-2xl shadow-inner bg-slate-50">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute top-3 left-3">
        <span className="bg-white/95 backdrop-blur-md text-brand-700 text-[9px] font-black px-2.5 py-1 rounded-lg border border-brand-100 uppercase tracking-widest shadow-sm">
          {post.category}
        </span>
      </div>
    </div>
    <div className="px-6 pb-6 pt-2 flex flex-col flex-1">
      <h3 className="text-lg md:text-xl font-black text-slate-900 mb-3 line-clamp-2 group-hover:text-brand-600 transition-colors leading-tight tracking-tight">
        {post.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed font-medium">
        {post.summary}
      </p>

      <div className="mt-auto pt-4 border-t border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-brand-500" />
              <span className="truncate max-w-[80px] text-slate-600">{post.author}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-brand-500" />
              {post.date}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Blogs = () => {
  const [activeCategory, setActiveCategory] = useState("All Posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const navigate = useNavigate();

  // Load dynamic posts from local file system API
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => {
        // Safe check in case data hasn't been created yet
        const dynamicPosts = Array.isArray(data) ? data : [];
        setAllPosts(dynamicPosts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading live blogs:", err);
        setLoading(false);
      });
  }, []);

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory =
      activeCategory === "All Posts" || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thanks for subscribing to our newsletter!");
    setEmail("");
  };

  return (
    <div className="bg-white pt-12 pb-0">
      {/* Hero Section */}
      <div className="container mx-auto px-4 text-center mb-16 max-w-4xl relative">
        <button
          onClick={() => navigate("/admin/blogs")}
          className="absolute -top-12 right-4 md:-right-12 bg-brand-50 text-brand-600 hover:bg-brand-100 p-3 rounded-2xl transition-all group flex items-center gap-2 border border-brand-100 shadow-sm"
          title="Admin Dashboard"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider hidden group-hover:block">
            Admin
          </span>
        </button>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Blog & <span className="text-brand-600">Resources</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Expert insights, tips, and guides on OST to PST conversion, email data
          management, and Outlook best practices.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto px-4 sm:px-0">
          <Search className="absolute left-8 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/30 transition-all text-slate-700 shadow-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container mx-auto px-4 mb-12 overflow-x-auto">
        <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-3 pb-4 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      <div className="container mx-auto px-4 mb-20 max-w-7xl">
        {loading ? (
          <div className="col-span-full text-center py-20 text-slate-500 font-medium">
            Loading articles...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {visiblePosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onClick={() => navigate(`/blogs/${post.slug || post.id}`)}
              />
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-slate-500 font-medium">
              No articles found matching your criteria.
            </p>
          </div>
        )}

        {filteredPosts.length > visibleCount && (
          <div className="mt-20 text-center">
            <button
              onClick={handleLoadMore}
              className="bg-brand-600 text-white font-black px-12 py-5 rounded-full hover:bg-brand-700 transition-all hover:shadow-2xl hover:shadow-brand-200 hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-brand-100"
            >
              Load More Articles
            </button>
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="mt-20 py-24 bg-brand-600 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-800 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20 blur-[100px]"></div>

        <div className="container mx-auto px-4 relative z-10 text-center text-white max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Stay Updated with Our Newsletter
          </h2>
          <p className="text-brand-50/90 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Get the latest tips, guides, and updates delivered directly to your
            inbox. Join 5000+ Outlook experts.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto p-2 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20"
          >
            <div className="flex-1 relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-14 pr-6 py-5 rounded-full bg-transparent text-white placeholder:text-white/60 focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#FFB800] hover:bg-white text-slate-900 font-black px-12 py-5 rounded-full transition-all shadow-xl hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>
        </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white text-center mt-10">Ask the Expert !</h1>
          <p className="text-brand-50/90 text-xl max-w-2xl mx-auto font-medium leading-relaxed text-center">Submit your problem related to the OST File or Outlook, and our expert will guide you!</p>
          <button className="bg-[#FFB800] hover:bg-white text-slate-900 font-black px-12 py-5 rounded-full transition-all shadow-xl hover:scale-[1.02] active:scale-95 whitespace-nowrap mx-auto block mt-5" onClick={() => navigate("/support")}>Contact Us</button>
      </div>
    </div>
  );
};

export default Blogs;
