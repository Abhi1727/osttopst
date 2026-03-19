import React, { useState, useEffect } from "react";
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
  ArrowRight,
  Star,
  Download,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

const BlogPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState([]);
  const [toc, setToc] = useState([]);
  const [activeSection, setActiveSection] = useState("");
  const [helpfulCount, setHelpfulCount] = useState(124);

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
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [processedContent, setProcessedContent] = useState("");

  // Dynamic Content Processor: Injection of Pro-Tips and CTAs
  useEffect(() => {
    if (!post?.content) {
      setProcessedContent("");
      setToc([]);
      return;
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, "text/html");
    
    // 1. Remove redundancy
    const firstImg = doc.querySelector("img");
    if (firstImg) firstImg.remove();

    // 2. ToC Extraction
    const headings = doc.querySelectorAll("h2, h3");
    const newToc = [];
    headings.forEach((heading, index) => {
      const hid = `heading-${index}`;
      heading.setAttribute("id", hid);
      newToc.push({
        id: hid,
        text: heading.textContent,
        level: heading.tagName.toLowerCase(),
      });
    });
    setToc(newToc);

    // 3. Inline CTA Injection (After 2nd paragraph)
    const paragraphs = doc.querySelectorAll("p");
    if (paragraphs.length >= 2) {
      const ctaContainer = doc.createElement("div");
      ctaContainer.className = "inline-cta-card group";
      ctaContainer.innerHTML = `
        <div class="cta-bg"></div>
        <div class="max-w-lg relative z-10 text-left">
          <h4 class="text-white">Recover your OST data instantly</h4>
          <p class="text-slate-400">Don't let file corruption stop your work. Our enterprise-grade tool handles 100GB+ files with ease.</p>
        </div>
        <button class="relative z-10 px-8 py-4 bg-brand-600 rounded-xl text-white font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Download Converter</button>
      `;
      paragraphs[1].after(ctaContainer);
    }

    // 4. Transform certain paragraphs to Pro-Tips
    paragraphs.forEach((p) => {
      if (p.textContent.toLowerCase().includes("pro tip:") || p.textContent.toLowerCase().includes("note:")) {
        p.className = "pro-tip";
      }
      if (p.textContent.toLowerCase().includes("warning:") || p.textContent.toLowerCase().includes("caution:")) {
        p.className = "warning-box";
      }
    });

    setProcessedContent(doc.body.innerHTML);
  }, [post?.content]);

  // Intersection Observer for scroll highlighting
  useEffect(() => {
    if (!toc.length) return;
    
    const obOptions = {
      root: null,
      rootMargin: '-15% 0px -75% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, obOptions);

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-20 text-slate-500 font-inter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse font-black text-[11px] uppercase tracking-widest">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-20 font-inter">
        <div className="text-center px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-6 font-heading tracking-tight">Article Not Found</h2>
          <button
            onClick={() => navigate("/blog")}
            className="text-brand-600 font-black text-[11px] uppercase tracking-widest hover:underline inline-flex items-center gap-2"
          >
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const recommendedPosts = allPosts.filter((p) => String(p.id) !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white pt-8 pb-20 overflow-x-hidden font-inter selection:bg-brand-100 selection:text-brand-900">
      {/* Scroll Progress Bar - Integrated below Header */}
      <div
        className="fixed top-14 md:top-16 left-0 h-1.5 bg-brand-500 z-[70] transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
        style={{ width: `${readingProgress}%` }}
      ></div>

      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/blog")}
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black text-[11px] mb-16 uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Insights
          </button>

          {/* SaaS Hero Section */}
          <header className="max-w-5xl mx-auto text-center mb-24 px-4 relative">
            <div className="flex flex-col items-center gap-8">
              <div className="flex items-center gap-4">
                <span className="bg-brand-50 text-brand-700 text-[10px] font-black px-8 py-3 rounded-xl uppercase tracking-[0.2em] border border-brand-100 shadow-sm">
                  {post.category}
                </span>
                <div className="flex items-center gap-1.5 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 shadow-sm text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl font-heading">
                {post.title}
              </h1>

              {/* Trust Signals & CTA */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mt-4">
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex text-amber-400 gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Trusted by 40,000+ Teams
                  </p>
                </div>

                <div className="w-px h-12 bg-slate-200 hidden md:block"></div>

                <button className="bg-brand-600 hover:bg-slate-900 text-white font-black px-12 py-6 rounded-[1.5rem] tracking-widest uppercase text-xs transition-all hover:scale-105 shadow-2xl shadow-brand-900/30 flex items-center gap-4">
                  <Download className="w-4.5 h-4.5" />
                  Download Free Trial
                </button>
              </div>
            </div>
          </header>

          {/* SaaS Framed Image */}
          <div className="w-full mb-28 px-4">
            <div className="relative group">
              <div className="absolute -inset-4 bg-slate-100/50 rounded-[4rem] blur-2xl group-hover:bg-brand-100/30 transition-all duration-700"></div>
              <div className="relative aspect-[21/9] md:aspect-[21/8.5] overflow-hidden rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] bg-slate-100 border-8 border-white">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 xl:gap-32 px-4">
            {/* Left Sidebar - SaaS Style */}
            <aside className="lg:w-[320px] shrink-0">
              <div className="sticky top-32 space-y-20">
                <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.25em] mb-10 flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full"></div>
                    Guide Index
                  </h4>
                  <nav className="space-y-8">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          if (el) {
                            const offset = 120;
                            const bodyRect = document.body.getBoundingClientRect().top;
                            const elementRect = el.getBoundingClientRect().top;
                            const elementPosition = elementRect - bodyRect;
                            const offsetPosition = elementPosition - offset;
                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          }
                        }}
                        className={`block text-[12px] font-bold uppercase tracking-[0.15em] transition-all relative pl-10 leading-relaxed ${
                          activeSection === item.id ? "text-brand-600 translate-x-3" : 
                          item.level === "h3" ? "ml-6 text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[3px] bg-brand-500 transition-all duration-500 rounded-full ${
                          activeSection === item.id ? "opacity-100" : "opacity-0"
                        }`}></div>
                        {item.text}
                      </a>
                    ))}
                    {toc.length === 0 && (
                      <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest italic">Getting Started</p>
                    )}
                  </nav>
                </div>

                <div className="px-6 space-y-12">
                  <div className="flex flex-col gap-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
                      Engagement
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <p className="text-2xl font-black text-slate-900 leading-none">{helpfulCount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Readers helped</p>
                      </div>
                      <button 
                        onClick={() => setHelpfulCount(c => c + 1)}
                        className="w-14 h-14 bg-white border border-slate-100 shadow-md rounded-2xl flex items-center justify-center text-slate-400 hover:text-brand-600 hover:scale-110 transition-all active:scale-95"
                      >
                        <ThumbsUp className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-4">
                      Share Insights
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {[Twitter, Facebook, Linkedin].map((Icon, i) => (
                        <button
                          key={i}
                          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100 shadow-sm"
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <article className="lg:w-[calc(100%-320px)] min-w-0">
              <div
                className="blog-content-rich md:text-[1.15rem] tracking-[-0.01em] text-left"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* SaaS Engagement Footer */}
              <div className="mt-40 p-16 rounded-[4rem] bg-slate-50 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="space-y-4 text-center md:text-left">
                    <h3 className="text-3xl font-black text-slate-900 font-heading tracking-tight">Found this guide helpful?</h3>
                    <p className="text-slate-500 font-medium">Download our free kit to fix all Outlook errors in minutes.</p>
                  </div>
                  <div className="flex gap-6">
                    <button className="flex items-center gap-3 bg-brand-600 text-white hover:bg-slate-900 transition-all font-black text-[11px] uppercase tracking-widest px-10 py-5 rounded-[1.5rem] shadow-xl shadow-brand-900/20">
                      <Download className="w-4.5 h-4.5" />
                      Get Free Kit
                    </button>
                    <button className="flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest px-10 py-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
                      <Share2 className="w-4.5 h-4.5" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* SaaS Style Recommendations Section */}
          <section className="mt-40 pt-40 border-t border-slate-100 font-inter">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 px-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-[0.3em]">
                  <Zap className="w-4 h-4 fill-current" />
                  Continue Learning
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-heading tracking-tight text-left">
                  More Technical Insights
                </h3>
              </div>
              <button 
                onClick={() => navigate("/blog")}
                className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest pb-1 border-b-2 border-transparent hover:border-slate-900"
              >
                View Library
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
              {recommendedPosts.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => navigate(`/blogs/${rec.id}`)}
                  className="group cursor-pointer space-y-6"
                >
                  <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border-4 border-white">
                    <img
                      src={rec.image}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="space-y-3 px-2 text-left">
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-4 py-1.5 rounded-lg inline-block">
                      {rec.category}
                    </span>
                    <h4 className="font-black text-slate-900 text-xl leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
                      {rec.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
