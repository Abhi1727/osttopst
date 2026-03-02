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
} from "lucide-react";

// Import images/data
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
      <h2>Introduction</h2>
      <p>Converting OST files to PST is a common task for Outlook users migrating between systems or recovering data. However, the process can be fraught with risks if not handled correctly. In this guide, we'll explore the safest methods to ensure zero data loss.</p>
      
      <h2>Why Convert OST to PST?</h2>
      <p>OST (Offline Storage Table) files are tied to specific profiles. If the profile is deleted or the server connection is lost, the OST becomes inaccessible. Converting to PST (Personal Storage Table) creates a portable, standalone backup of your data.</p>
      
      <blockquote>
        "Data integrity is the most critical aspect of any migration. Always verify your backups before starting the conversion process."
      </blockquote>

      <h2>Step-by-Step Conversion Guide</h2>
      <p>The most reliable way to convert is using a professional tool like OST to PST Converter. Here's a quick overview of the professional workflow:</p>
      <ol>
        <li><strong>Select Source:</strong> Load your OST file into the software.</li>
        <li><strong>Preview Items:</strong> Verify the hierarchy of folders (Inbox, Contacts, Calendar).</li>
        <li><strong>Export to PST:</strong> Choose the destination and start the conversion.</li>
      </ol>

      <h2>Conclusion</h2>
      <p>By following these best practices, you can ensure that your transition is smooth and your valuable email data remains intact. Always choose tools that offer high-precision conversion and support large file sizes.</p>
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
      "<h2>Data Security Fundamentals</h2><p>Outlook files contain some of the most sensitive corporate data. Protecting them requires a multi-layered approach involving encryption, regular backups, and secure conversion practices.</p><h3>Encryption and Password Protection</h3><p>Always ensure your PST files are password protected. This adds a layer of security if the file is ever accidentally shared or accessed by unauthorized users.</p>",
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

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    // Combine static and dynamic posts
    const savedPosts = localStorage.getItem("published_blogs");
    const dynamicPosts = savedPosts ? JSON.parse(savedPosts) : [];
    const allPosts = [...dynamicPosts, ...STATIC_POSTS];

    const foundPost = allPosts.find((p) => String(p.id) === String(id));
    if (foundPost) {
      setPost(foundPost);
    }
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
    <div className="bg-white">
      {/* Reading Progress Indicator */}
      <div
        className="fixed top-20 left-0 h-1 bg-emerald-500 z-[60] transition-all duration-300 shadow-lg shadow-emerald-200"
        style={{ width: `${readingProgress}%` }}
      ></div>

      {/* Hero Header */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 opacity-40"></div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <button
            onClick={() => navigate("/blogs")}
            className="flex items-center gap-2 text-emerald-600 font-bold mb-10 hover:translate-x-1 transition-transform group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200">
              {post.category}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 pb-12 border-b border-slate-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {post.author}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    Author
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-emerald-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {post.date}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    Published
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {post.readTime}
                  </p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                    Read Time
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-3 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-32">
          {/* Main Article */}
          <article className="lg:col-span-8">
            <div className="rounded-[3rem] overflow-hidden mb-16 shadow-2xl shadow-slate-100/50">
              <img
                src={post.image}
                alt={post.title}
                className="w-full object-cover max-h-[500px]"
              />
            </div>

            <div
              className="prose prose-slate max-w-none 
                prose-h2:text-4xl prose-h2:font-black prose-h2:text-slate-900 prose-h2:tracking-tight prose-h2:mb-6 prose-h2:mt-12
                prose-h3:text-2xl prose-h3:font-bold prose-h3:text-slate-800 prose-h3:mb-4
                prose-p:text-lg prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:mb-8
                prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:p-8 prose-blockquote:rounded-3xl prose-blockquote:text-emerald-900 prose-blockquote:font-bold prose-blockquote:text-xl prose-blockquote:italic
                prose-ul:list-disc prose-ul:ml-6 prose-ul:space-y-3 prose-ul:mb-8
                prose-ol:list-decimal prose-ol:ml-6 prose-ol:space-y-3 prose-ol:mb-8
                prose-li:text-slate-600 prose-li:text-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Share this article:
                </span>
                <div className="flex gap-2">
                  <button className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-500 hover:border-sky-100 transition-all shadow-sm">
                    <Twitter className="w-5 h-5 fill-current" />
                  </button>
                  <button className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                    <Linkedin className="w-5 h-5 fill-current" />
                  </button>
                  <button className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all shadow-sm">
                    <Facebook className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Migration", "OST File", "Outlook"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-50 text-slate-500 text-xs font-bold px-4 py-2 rounded-lg border border-slate-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Table of Contents / Quick Links */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 sticky top-32">
              <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                Table of <span className="text-emerald-600">Contents</span>
              </h4>
              <ul className="space-y-4">
                {[
                  "Overview",
                  "Pre-Conversion Checks",
                  "Step-by-Step Flow",
                  "Common Pitfalls",
                  "Safe Tools",
                ].map((item, idx) => (
                  <li
                    key={item}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <span className="text-slate-500 font-bold text-sm group-hover:text-emerald-600 transition-colors flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                        0{idx + 1}
                      </span>
                      {item}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 translate-x-0 group-hover:translate-x-1 transition-all" />
                  </li>
                ))}
              </ul>

              <div className="mt-10 p-6 bg-emerald-600 rounded-3xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <h5 className="font-black mb-3">Professional Converter</h5>
                <p className="text-xs text-emerald-50/80 mb-6 leading-relaxed">
                  Recover your Outlook data with 100% integrity using our
                  premium web tool.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="w-full bg-white text-emerald-700 font-black py-3 rounded-2xl text-xs hover:bg-emerald-50 transition-all"
                >
                  Get Started →
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
