import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Star,
  Download,
  ThumbsUp,
  Newspaper,
  BookOpen
} from "lucide-react";
// Blog images are now rendered properly

const formatTitle = (rawTitle) => {
  if (!rawTitle) return "";
  let title = rawTitle;
  title = title.replace(/^Blog\s+\d+\s+/i, "");
  title = title.replace(/\s*\d{2}[-_]\d{2}[-_]\d{4}\s*/g, " ");
  title = title.replace(/\s*\(\d+\)\s*/g, " ");
  title = title.replace(/\.docx?$/i, "");
  return title.trim();
};

const BlogPostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [helpfulCount, setHelpfulCount] = useState(124);
  const [processedContent, setProcessedContent] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/blogs");
        if (res.ok) {
          const data = await res.json();
          setAllPosts(data);
          // Try matching by slug, fallback to ID for compatibility
          const dynamicPost = data.find(
            (p) => p.slug === slug || String(p.id) === slug,
          );
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
  }, [slug]);

  // Handle Canonical Tag specific to the blog post
  useEffect(() => {
    if (post) {
      const baseUrl = "https://www.osttopst.us";
      const canonicalUrl = post.canonicalTag || `${baseUrl}/blogs/${post.slug || post.id}`;

      let link = document.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }
  }, [post]);

  // Dynamic Content Processor: Injection of CTA and removing old images
  useEffect(() => {
    if (!post?.content) {
      setProcessedContent("");
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, "text/html");

    // 1. Remove redundancy if content starts with an image that matches the thumbnail
    // For now, we'll keep the content as is unless it's clearly a duplicate of the header image
    
    setProcessedContent(doc.body.innerHTML);

    setProcessedContent(doc.body.innerHTML);
  }, [post?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center pt-20 font-inter">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-black mb-4">
            Post Not Found
          </h2>
          <button
            onClick={() => navigate("/blogs")}
            className="text-brand-600 font-bold hover:underline"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  const recommendedPosts = allPosts
    .filter((p) => p.slug !== slug && String(p.id) !== slug)
    .slice(0, 4);

  return (
    <div
      className="min-h-screen bg-[#f4f7fb] font-inter pb-20 pt-10"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full md:w-[80%] mx-auto px-4 md:px-0">
        {/* Categories Above Image (Centered) */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="bg-brand-600 text-white text-[13px] font-semibold px-5 py-2 rounded-full shadow-sm">
            {post.category || "Technology"}
          </span>
          <div className="flex items-center gap-1.5 bg-brand-600 text-white text-[13px] font-semibold px-5 py-2 rounded-full shadow-sm">
            <Clock className="w-4 h-4" />
            {post.readTime || "5 Min Read"}
          </div>
        </div>

        {/* Primary Blog Image */}
        <div className="w-full mb-8">
          <div className="aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl bg-brand-50 border-2 border-slate-50 flex items-center justify-center">
            {post.image && post.image !== "null" ? (
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-16 h-16 text-brand-500/20" />
            )}
          </div>
        </div>

        <div className="w-full">
          {/* Trust Section */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 text-center">
            <div className="sm:absolute sm:left-0 flex flex-col items-center sm:items-start gap-1">
              <div className="flex gap-1 text-[#fbbf24]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-[13px] font-bold text-slate-800">
                Trusted by 40,000+ Teams
              </span>
            </div>

            <button className="bg-black hover:bg-slate-800 transition-colors text-white text-sm font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
              <Download className="w-4 h-4" />
              Download Free Trial
            </button>
          </div>

          {/* Dynamic Rich Content Render */}
          <div className="dynamic-blog-content text-[15px] text-slate-700 leading-relaxed font-medium">
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .dynamic-blog-content p {
                 margin-bottom: 2rem;
                 line-height: 1.8;
              }
              .dynamic-blog-content h1 {
                 font-size: 36px;
                 font-weight: 900;
                 color: #000;
                 margin-top: 1rem;
                 margin-bottom: 1.5rem;
                 letter-spacing: -0.025em;
                 line-height: 1.2 !important;
              }
              @media (min-width: 768px) {
                .dynamic-blog-content h1 {
                   font-size: 48px;
                }
              }
              .dynamic-blog-content h2, .dynamic-blog-content h3 {
                 font-size: 24px;
                 font-weight: 800;
                 color: #000;
                 margin-top: 2rem;
                 margin-bottom: 1rem;
                 letter-spacing: -0.025em;
                 line-height: 1.3 !important;
              }
              .dynamic-blog-content a {
                 color: #0284c7;
                 font-weight: 700;
              }
              .dynamic-blog-content a:hover {
                 text-decoration: underline;
              }
              .dynamic-blog-content ul {
                 list-style-type: disc;
                 padding-left: 1.5rem;
                 margin-bottom: 2rem;
              }
              .dynamic-blog-content ol {
                 list-style-type: decimal;
                 padding-left: 1.5rem;
                 margin-bottom: 2rem;
              }
              .dynamic-blog-content li {
                 margin-bottom: 0.5rem;
                 line-height: 1.8;
              }
              .dynamic-blog-content table {
                 width: 100%;
                 border-collapse: collapse;
                 margin-bottom: 2rem;
              }
              .dynamic-blog-content th, .dynamic-blog-content td {
                 border: 1px solid #e2e8f0;
                 padding: 0.75rem 1rem;
                 text-align: left;
              }
              .dynamic-blog-content th {
                 background-color: #f8fafc;
                 font-weight: 700;
                 color: #0f172a;
              }
            `,
              }}
            />
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>

          {/* CTA Card injected at the end of the blog content */}
          <div className="mt-8 mb-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:py-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-[18px] md:text-[20px] font-bold text-black tracking-tight m-0 p-0">
                Found this guide helpful?
              </h3>
              <p className="text-slate-600 text-[14px] m-0 p-0">
                Download our free kit to fix all Outlook errors in minutes.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 border-none cursor-pointer">
                <Download className="w-4 h-4" />
                Get It Free Kit
              </button>
              <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 border-none cursor-pointer">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Engagement Row */}
          <div className="flex flex-col gap-2 py-2 mb-16">
            <span className="text-[15px] font-bold text-black">Engagement</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-black font-medium text-[14px]">
                  {helpfulCount} Readers Helped
                </span>
                <button
                  onClick={() => setHelpfulCount((c) => c + 1)}
                  className="hover:scale-110 transition-transform"
                >
                  <ThumbsUp className="w-4 h-4 text-black hover:text-brand-600 stroke-[1.5]" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[14px] text-black font-medium">
                  Share Insights
                </span>
                <div className="flex gap-4">
                  <button className="flex items-center justify-center text-black hover:text-brand-600 transition-colors">
                    <Twitter className="w-5 h-5 stroke-[1.5]" />
                  </button>
                  <button className="flex items-center justify-center text-black hover:text-brand-600 transition-colors">
                    <Facebook className="w-5 h-5 stroke-[1.5]" />
                  </button>
                  <button className="flex items-center justify-center text-black hover:text-brand-600 transition-colors">
                    <Linkedin className="w-5 h-5 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Blogs Grid Section */}
        {recommendedPosts.length > 0 && (
          <div className="w-full mb-16">
            <h3 className="text-[24px] font-extrabold text-brand-600 tracking-tight mb-8">
              More Blogs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {recommendedPosts.map((blog, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/blogs/${blog.id || blog.slug}`)}
                  className="group cursor-pointer flex flex-col gap-4"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-brand-50 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center border border-brand-100">
                    {blog.image && blog.image !== "null" ? (
                      <img src={blog.image} alt={blog.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Newspaper className="w-10 h-10 text-brand-500/20" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[18px] md:text-[20px] font-extrabold text-black tracking-tight leading-[1.3] group-hover:text-brand-600 transition-colors">
                      {formatTitle(blog.title)}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostDetail;
