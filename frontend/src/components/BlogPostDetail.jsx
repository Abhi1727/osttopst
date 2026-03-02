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

const STATIC_POSTS = [
  {
    id: 1,
    title: "How to Convert OST to PST Files Safely Without Data Loss",
    summary:
      "Learn the best practices for converting OST files to PST format while maintaining data integrity and ensuring all your emails, contacts, and calendar items are preserved.",
    content: `
      <h2>The Digital Lifeline: Understanding OST and PST</h2>
      <p>In the ecosystem of Microsoft Outlook, OST (Offline Storage Table) and PST (Personal Storage Table) files serve as the backbone of your email data. While an OST file allows you to work offline and synchronizes your changes when you're back online, a PST file is a standalone archive that stores your emails, contacts, and calendar on your local machine.</p>
      
      <p>There are several scenarios where shifting data from OST to PST becomes a necessity: recovering data from an orphaned OST file, migrating to a new machine, or simply creating a portable backup. However, doing this manually or with unverified tools often leads to the most dreaded outcome: <strong>Data Corruption.</strong></p>
      
      <blockquote>
        "An email isn't just a message; it's a record, a memory, and often a legal document. Treating its conversion with anything less than 100% precision is a gamble no professional should take."
      </blockquote>

      <h2>Step 1: Assessing your Data Integrity</h2>
      <p>Before initiating any conversion, it's vital to ensure your source file is "healthy". If your OST is already corrupted, standard export methods built into Outlook will likely fail. This is where professional-grade algorithms shine—they bypass the profile dependency and read the raw data blocks directly.</p>

      <h2>The Conversion Workflow</h2>
      <p>When using a high-end converter, the process should be as seamless as it is robust. Here is the architecture of a perfect conversion:</p>
      <ul>
        <li><strong>Deep Scanning:</strong> The engine analyzes the OST file structure without modifying it.</li>
        <li><strong>Preview Logic:</strong> You should be able to see every email and attachment before committing to the export.</li>
        <li><strong>Multi-Format Output:</strong> While PST is the goal, flexibility to export to EML or MSG is a sign of a versatile tool.</li>
      </ul>

      <h2>Conclusion: Why Settle for Less?</h2>
      <p>In a world where data is the new currency, your archival strategy should be foolproof. By choosing professional conversion tools over "quick fixes," you're not just moving files—you're preserving your professional legacy.</p>
    `,
    category: "Data Migration",
    author: "Sarah Johnson",
    date: "Feb 28, 2026",
    readTime: "5 min read",
    image: imgMigration,
  },
  {
    id: 2,
    title: "Understanding Email Data Security: Protecting Your Outlook Files",
    summary:
      "Discover essential security measures to protect your Outlook data files from unauthorized access, corruption, and potential data breaches.",
    content:
      "<h2>Security in the Modern Inbox</h2><p>Outlook files contain some of the most sensitive corporate data. Protecting them requires a multi-layered approach involving encryption, regular backups, and secure conversion practices.</p><h3>Encryption and Password Protection</h3><p>Always ensure your PST files are password protected. This adds a layer of security if the file is ever accidentally shared or accessed by unauthorized users.</p>",
    category: "Security",
    author: "Michael Chen",
    date: "Feb 25, 2026",
    readTime: "7 min read",
    image: imgSecurity,
  },
];

const BlogPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      try {
        // Try to fetch from API first (dynamic posts)
        const res = await fetch("/api/blogs");
        if (res.ok) {
          const data = await res.json();
          // ID from useParams is string, api IDs might be number or string
          const dynamicPost = data.find((p) => String(p.id) === id);
          if (dynamicPost) {
            setPost(dynamicPost);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching live post:", err);
      }

      // Fallback to static posts
      const staticPost = BLOG_POSTS.find((p) => String(p.id) === id);
      if (staticPost) {
        setPost(staticPost);
      }
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-white pt-20 text-slate-500 font-medium">
        Loading post...
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* Immersive Scroll Progress Bar */}
      <div
        className="fixed top-20 left-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 z-[70] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        style={{ width: `${readingProgress}%` }}
      ></div>

      {/* Floating Header Actions */}
      <div className="fixed top-28 left-4 md:left-12 z-50 flex flex-col gap-3">
        <button
          onClick={() => navigate("/blogs")}
          className="w-12 h-12 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100 transition-all group"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="fixed top-28 right-4 md:right-12 z-50 flex flex-col gap-3">
        <button className="w-12 h-12 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all hover:shadow-lg">
          <Bookmark className="w-5 h-5" />
        </button>
        <button className="w-12 h-12 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all hover:shadow-lg">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Full-Width Immersive Hero */}
      <header className="relative w-full h-[65vh] min-h-[500px] flex items-end">
        <div className="absolute inset-0 z-0">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {/* Professional Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900/90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 max-w-[90rem] relative z-10 pb-20">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-block bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-[0.2em] mb-8 shadow-lg shadow-emerald-500/20">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] mb-10 tracking-tight max-w-4xl drop-shadow-sm">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-8 text-white/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50 font-bold">
                    Written by
                  </p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {post.author}
                  </p>
                </div>
              </div>

              <div className="w-px h-8 bg-white/20 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50 font-bold">
                    Published
                  </p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {post.date}
                  </p>
                </div>
              </div>

              <div className="w-px h-8 bg-white/20 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/50 font-bold">
                    Reading time
                  </p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">
                    {post.readTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Section - High End Editorial Layout */}
      <main className="relative pb-40">
        <div className="container mx-auto  max-w-[90rem]">
          <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
            {/* Left Column: Post Stats / Quick Info */}
            <aside className="lg:w-[20%] xl:w-1/4 pt-20 order-2 lg:order-1">
              <div className="sticky top-40 space-y-12">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Share Article
                  </h4>
                  <div className="flex gap-3">
                    <button className="w-14 h-14 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-800 hover:bg-slate-900 hover:text-white hover:shadow-xl transition-all">
                      <Twitter className="w-5 h-5 fill-current" />
                    </button>
                    <button className="w-14 h-14 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-800 hover:bg-slate-900 hover:text-white hover:shadow-xl transition-all">
                      <Linkedin className="w-5 h-5 fill-current" />
                    </button>
                    <button className="w-14 h-14 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-800 hover:bg-slate-900 hover:text-white hover:shadow-xl transition-all">
                      <Facebook className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">
                    Key Details
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Difficulty
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Intermediate
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Tool Version
                      </span>
                      <span className="text-emerald-600 font-bold">v4.2.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 font-medium">
                        Integrity Check
                      </span>
                      <span className="text-emerald-600 font-bold">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Middle Column: The Article (Wider Layout) */}
            <article className="lg:w-[75%] xl:w-[65%] pt-20 order-1 lg:order-2">
              <div
                className="prose prose-slate max-w-none 
                  prose-h2:text-4xl md:prose-h2:text-5xl prose-h2:font-black prose-h2:text-slate-900 prose-h2:tracking-tight prose-h2:mb-10 prose-h2:mt-16
                  prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:font-bold prose-h3:text-slate-800 prose-h3:mb-6
                  prose-p:text-xl prose-p:text-slate-600 prose-p:leading-[1.85] prose-p:mb-10 prose-p:font-serif
                  prose-blockquote:border-l-0 prose-blockquote:bg-emerald-900 prose-blockquote:p-12 prose-blockquote:rounded-[2.5rem] prose-blockquote:text-white prose-blockquote:font-black prose-blockquote:text-3xl prose-blockquote:italic prose-blockquote:my-16 prose-blockquote:shadow-2xl prose-blockquote:shadow-emerald-200
                  prose-ul:list-none prose-ul:ml-0 prose-ul:space-y-6 prose-ul:mb-10
                  prose-li:text-slate-600 prose-li:text-xl prose-li:pl-8 prose-li:relative prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-4 prose-li:before:w-3 prose-li:before:h-3 prose-li:before:bg-emerald-500 prose-li:before:rounded-full
                  prose-strong:text-slate-900 prose-strong:font-black
                  prose-img:rounded-3xl prose-img:shadow-2xl prose-img:mx-auto prose-img:my-16 prose-img:border prose-img:border-slate-100"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              <div className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-white flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <ThumbsUp className="w-12 h-12 text-emerald-500 mb-6" />
                <h3 className="text-3xl font-black mb-4">
                  Did you find this helpful?
                </h3>
                <p className="text-slate-400 max-w-sm mb-10 leading-relaxed">
                  Join 20,000+ professionals who get our weekly insights on data
                  migration and email security.
                </p>
                <div className="flex gap-4">
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-4 rounded-2xl transition-all hover:scale-105">
                    Yes, absolutely!
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white font-black px-10 py-4 rounded-2xl transition-all">
                    Send Feedback
                  </button>
                </div>
              </div>
            </article>

            {/* Right Column: Mini CTA */}
            <aside className="hidden xl:block xl:w-[10%] pt-20 order-3">
              <div className="sticky top-40 space-y-6">
                <div className="text-center p-4 border-b border-slate-100 mb-8 pb-8">
                  <MessageSquare className="w-5 h-5 text-emerald-500 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Engage
                  </p>
                  <p className="text-xs font-bold text-slate-800">42</p>
                </div>
                <div className="text-center p-4 border-b border-slate-100 mb-8 pb-8">
                  <ThumbsUp className="w-5 h-5 text-emerald-500 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Reaction
                  </p>
                  <p className="text-xs font-bold text-slate-800">128</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Recommended Section */}
      <section className="bg-slate-50 py-32 border-t border-slate-100">
        <div className="container mx-auto px-3 max-w-[90rem]">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Read <span className="text-emerald-600">Next</span>
            </h2>
            <button
              onClick={() => navigate("/blogs")}
              className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-widest hover:text-emerald-600 transition-colors"
            >
              Explore all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {STATIC_POSTS.slice(0, 2).map((next) => (
              <div
                key={next.id}
                onClick={() => navigate(`/blogs/${next.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/8] rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-slate-200">
                  <img
                    src={next.image}
                    alt={next.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition-all"></div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight">
                  {next.title}
                </h3>
                <p className="text-slate-500 line-clamp-2 text-sm leading-relaxed">
                  {next.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPostDetail;
