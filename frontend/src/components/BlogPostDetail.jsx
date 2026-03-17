import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Bookmark,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
} from "lucide-react";

// Import images/data (same as static posts)
import imgMigration from "../assets/blog/blog_email_migration_1772432378369.png";
import imgSecurity from "../assets/blog/blog_data_security_1772432391754.png";
import imgCloud from "../assets/blog/blog_cloud_storage_1772432410345.png";
import imgTrouble from "../assets/blog/blog_troubleshooting_1772432450252.png";

const BlogPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [allPosts, setAllPosts] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/blogs");
        if (res.ok) {
          const data = await res.json();
          setAllPosts(data);
          const dynamicPost = data.find((p) => String(p.id) === id);
          if (dynamicPost) {
            setPost(dynamicPost);
          }
        }
      } catch (err) {
        console.error("Error fetching live post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20 text-slate-500 font-medium font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  const recommendedPosts = allPosts
    .filter((p) => String(p.id) !== id)
    .slice(0, 3);

  return (
    <div className="bg-white min-h-screen overflow-x-hidden font-inter selection:bg-brand-100 selection:text-brand-900">
      {/* Immersive Scroll Progress Bar */}
      <div
        className="fixed top-20 left-0 h-1 bg-brand-500 z-[70] transition-all duration-300"
        style={{ width: `${readingProgress}%` }}
      ></div>

      <div className="relative pt-2 pb-20">
        <div className="container mx-auto max-w-full">
          {/* Breadcrumb & Back */}
          <button
            onClick={() => navigate("/blogs")}
            className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors mb-12 group font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Articles
          </button>

          <div className="max-w-4xl mb-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="bg-brand-50 text-brand-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-brand-100/50">
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8">
              {post.title}
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white ring-2 ring-slate-50">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">
                    Author
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {post.author}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100"></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-1">
                  Published
                </p>
                <p className="text-sm font-black text-slate-900">{post.date}</p>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="w-full aspect-[21/9] overflow-hidden mb-20 shadow-2xl shadow-slate-200/50 group">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-1000 "
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-16 xl:gap-24">
            {/* Main Content */}
            <article className="lg:w-[68%]">
              <div
                className="blog-content-rich"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Engagement Footer */}
              <div className="mt-24 pt-16 border-t border-slate-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 group/footer">
                  <div className="flex items-center gap-8">
                    <button className="flex items-center gap-3 text-slate-500 hover:text-brand-600 transition-colors group">
                      <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-brand-50 transition-colors">
                        <ThumbsUp className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm">124 Likes</span>
                    </button>
                    <button className="flex items-center gap-3 text-slate-500 hover:text-brand-600 transition-colors group">
                      <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-brand-50 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm">Share Article</span>
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <Twitter className="w-5 h-5 fill-current" />
                    </button>
                    <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <Facebook className="w-5 h-5 fill-current" />
                    </button>
                    <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <Linkedin className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Redesigned Sidebar */}
            <aside className="lg:w-[32%] space-y-12">
              <div className="sticky top-32 space-y-12">
                {/* Author Card */}
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100/50 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:rotate-6 transition-transform">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">
                        {post.author}
                      </h4>
                      <p className="text-brand-600 font-bold text-xs uppercase tracking-widest">
                        Editorial Team
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    Senior migration expert specialized in Microsoft Cloud
                    technologies and forensic data recovery.
                  </p>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-white hover:bg-slate-900 hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-slate-200 transition-all">
                      View Profile
                    </button>
                    <button className="w-11 h-11 flex items-center justify-center bg-white hover:bg-brand-500 hover:text-white text-slate-400 rounded-xl border border-slate-200 transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* You May Like - Recommended */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full"></div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                      You may like
                    </h3>
                  </div>

                  <div className="space-y-8">
                    {recommendedPosts.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => navigate(`/blogs/${rec.id}`)}
                        className="flex gap-4 group cursor-pointer"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-lg shadow-slate-200/50 group-hover:-translate-y-1 transition-all duration-300">
                          <img
                            src={rec.image}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt=""
                          />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">
                            {rec.category}
                          </span>
                          <h4 className="font-black text-slate-900 text-sm leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
                            {rec.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                    {recommendedPosts.length === 0 && (
                      <p className="text-slate-400 text-xs italic">
                        More articles coming soon...
                      </p>
                    )}
                  </div>
                </div>

                {/* Promotional Banner */}
                <div className="relative p-8 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl shadow-brand-900/10 group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl group-hover:bg-brand-500/30 transition-colors"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight">
                      Professional Outlook Extraction Kit
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Convert unlimited OST files securely on your local machine
                      with full data integrity.
                    </p>
                    <button className="w-full bg-brand-500 hover:bg-white hover:text-slate-900 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all group-hover:scale-[1.02]">
                      Download Free Trial
                    </button>
                    <p className="text-center text-[10px] font-bold text-brand-500/60 uppercase tracking-widest">
                      Trusted by 40,000+ Users
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
