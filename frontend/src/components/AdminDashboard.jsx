import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Send,
  FileType,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import imgMigration from "../assets/blog/blog_email_migration_1772432378369.png";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import DOMPurify from "dompurify";

// Initialize PDF.js worker using a more stable and specific CDN path for v5
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const AdminDashboard = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, success, error
  const [extractedData, setExtractedData] = useState(null);
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [blogMetadata, setBlogMetadata] = useState({
    title: "",
    category: "Data Migration",
    excerpt: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null); // File to upload
  const [thumbnailPreview, setThumbnailPreview] = useState(imgMigration); // Preview image
  const [isManualThumbnail, setIsManualThumbnail] = useState(false); // Track if user manually uploaded

  // Load posts on mount from API
  React.useEffect(() => {
    fetch("/api/blogs")
      .then((res) => res.json())
      .then((data) => setPublishedPosts(data))
      .catch((err) => console.error("Error loading blogs:", err));
  }, []);

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Please upload a valid image file for the thumbnail.");
        return;
      }
      setThumbnailFile(selectedFile); // Store the actual file for FormData
      setIsManualThumbnail(true); // Mark as manual override

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result); // Base64 just for preview
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or Word document.");
        return;
      }
      setFile(selectedFile);
      setUploadStatus("idle");
      setExtractedData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const arrayBuffer = await file.arrayBuffer();
      let content = "";
      let title = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
      let excerpt = "";

      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"
      ) {
        // Handle Word Upload with Image Support
        let firstImageFound = false;
        const options = {
          convertImage: (image) => {
            const isFirst = !firstImageFound;
            if (isFirst) firstImageFound = true;

            return image.read("base64").then((imageBuffer) => {
              const base64Data =
                "data:" + image.contentType + ";base64," + imageBuffer;

              if (isFirst) {
                // Store first image for thumbnail but don't include in content
                if (!isManualThumbnail) {
                  setThumbnailPreview(base64Data);
                }
                return {
                  // Returning an empty element that won't show anything
                  asElement: {
                    type: "element",
                    name: "span",
                    attributes: { style: "display:none", class: "hidden" },
                    children: [],
                  },
                };
              }

              return {
                src: base64Data,
              };
            });
          },
        };
        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        content = DOMPurify.sanitize(result.value);

        // Basic extraction for excerpt (first 160 chars)
        const plainText = result.value.replace(/<[^>]*>/g, "");
        excerpt = plainText.substring(0, 160) + "...";
      } else if (file.type === "application/pdf") {
        // Handle PDF Upload
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }
        // Basic HTML wrapping for PDF text
        content = fullText
          .split("\n\n")
          .filter((p) => p.trim())
          .map((p) => `<p>${p}</p>`)
          .join("");
        excerpt = fullText.substring(0, 160).trim() + "...";
      }

      setExtractedData({
        content:
          content ||
          "<h1>Empty Content</h1><p>No content could be extracted from this file.</p>",
        wordCount: content ? content.split(/\s+/).length : 0,
      });

      setBlogMetadata({
        title: title,
        category: "Data Migration",
        excerpt:
          excerpt ||
          "A deep dive into the technical details extracted from our latest research document...",
      });

      setUploadStatus("success");
      toast.success("Document analyzed and processed!");
    } catch (error) {
      console.error("Extraction error:", error);
      setUploadStatus("error");
      toast.error("Failed to process document format.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    // 1. Strict Form Validation
    if (!blogMetadata.title.trim()) {
      toast.error("Post Title is required before publishing.");
      return;
    }
    if (!blogMetadata.category.trim()) {
      toast.error("Category is required before publishing.");
      return;
    }
    if (!extractedData || !extractedData.content) {
      toast.error("You must upload and process a document before publishing.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", blogMetadata.title);
      formData.append("summary", blogMetadata.excerpt);
      formData.append("category", blogMetadata.category);
      formData.append("content", extractedData.content);
      formData.append("author", "SEO Admin");
      formData.append(
        "date",
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
      formData.append("readTime", "5 min read");
      formData.append("id", Date.now().toString());

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      } else {
        formData.append("defaultImage", thumbnailPreview); // fallback to migration image string
      }

      const response = await fetch("/api/blogs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to save blog to server");

      const result = await response.json();

      // Update UI list
      setPublishedPosts([result.blog, ...publishedPosts]);

      toast.success("Blog post published successfully!");

      // Reset state
      setFile(null);
      setExtractedData(null);
      setUploadStatus("idle");
      setBlogMetadata({
        title: "",
        category: "Data Migration",
        excerpt: "",
      });
      setThumbnailFile(null);
      setThumbnailPreview(imgMigration);
      setIsManualThumbnail(false);
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Error publishing blog to local file system.");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this blog post?",
      )
    ) {
      try {
        const response = await fetch(`/api/blogs/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete blog from server");

        setPublishedPosts(publishedPosts.filter((post) => post.id !== id));
        toast.success("Blog post deleted successfully.");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Error deleting blog.");
      }
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="font-black text-slate-900 tracking-tight mb-2">
              SEO <span className="text-brand-600">Admin Panel</span>
            </h1>
            <p className="text-slate-500 font-medium">
              Upload documents to automatically generate professional blog
              posts.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">
                Status
              </p>
              <p className="text-sm font-bold text-slate-700 leading-none">
                System Active
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                Upload Content
              </h2>

              <div
                className={`relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer
                  ${file ? "border-brand-500 bg-brand-50/30" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50"}`}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.pdf"
                  onChange={handleFileChange}
                />

                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-all
                    ${file ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "bg-slate-100 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600"}`}
                  >
                    {file ? (
                      <FileType className="w-8 h-8" />
                    ) : (
                      <Loader2
                        className={`w-8 h-8 ${isUploading ? "animate-spin" : ""}`}
                      />
                    )}
                  </div>

                  {file ? (
                    <div className="max-w-full">
                      <p className="text-sm font-bold text-slate-700 truncate mb-1">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-700 mb-1">
                        Click to upload doc or pdf
                      </p>
                      <p className="text-xs text-slate-400">
                        Word, PDF files up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {file && uploadStatus !== "success" && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-6 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Start Processing
                    </>
                  )}
                </button>
              )}
            </div>

            {extractedData && (
              <div className="bg-brand-600 p-8 rounded-[2.5rem] shadow-xl shadow-brand-100 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Ready to Publish
                </h3>
                <p className="text-brand-50/80 text-sm mb-6 leading-relaxed">
                  Your document has been processed. Review the metadata and
                  preview before pushing live.
                </p>
                <button
                  onClick={handlePublish}
                  className="w-full bg-white text-brand-700 font-black py-4 rounded-2xl hover:bg-brand-50 transition-all shadow-md active:scale-95"
                >
                  Publish to Blog
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Metadata & Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-brand-600" />
                  Blog Metadata
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                  Step 2: Review
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Post Title
                  </label>
                  <input
                    type="text"
                    value={blogMetadata.title}
                    onChange={(e) =>
                      setBlogMetadata({
                        ...blogMetadata,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter blog title"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:bg-white focus:border-brand-500/30 transition-all text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Category <span className="text-brand-500">*</span>
                  </label>
                  <input
                    list="categories"
                    value={blogMetadata.category}
                    onChange={(e) =>
                      setBlogMetadata({
                        ...blogMetadata,
                        category: e.target.value,
                      })
                    }
                    placeholder="Select or type custom category"
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:bg-white focus:border-brand-500/30 transition-all text-slate-700 font-medium"
                  />
                  <datalist id="categories">
                    <option value="Data Migration" />
                    <option value="Security" />
                    <option value="Best Practices" />
                    <option value="Cloud Solutions" />
                    <option value="Productivity" />
                    <option value="Troubleshooting" />
                  </datalist>
                </div>
              </div>

              {/* Thumbnail Upload Section */}
              <div className="mb-6 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Thumbnail Image
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="thumbnail-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                    />
                    <label
                      htmlFor="thumbnail-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-300 hover:shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-brand-600" />
                      Upload Custom Thumbnail
                    </label>
                    <p className="text-xs text-slate-400 mt-2">
                      Recommended size: 1200x630px (JPG, PNG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  SEO Excerpt
                </label>
                <textarea
                  rows="3"
                  value={blogMetadata.excerpt}
                  onChange={(e) =>
                    setBlogMetadata({
                      ...blogMetadata,
                      excerpt: e.target.value,
                    })
                  }
                  placeholder="Short summary for SEO..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:bg-white focus:border-brand-500/30 transition-all text-slate-700 font-medium resize-none"
                ></textarea>
              </div>

              <div className="border-t border-slate-50 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-brand-600" />
                    Content Preview
                  </h3>
                  {extractedData && (
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg">
                      {extractedData.wordCount} Words Extracted
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 min-h-[300px] border border-slate-100 blog-content-rich">
                  {extractedData ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: extractedData.content,
                      }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 text-center">
                      <FileText className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-bold">No content to preview.</p>
                      <p className="text-sm max-w-[200px] mt-1">
                        Select and process a file to see the automated
                        extraction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Published Blogs Section */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800">
              Manage Published Blogs
            </h2>
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {publishedPosts.length} Post{publishedPosts.length !== 1 && "s"}
            </span>
          </div>

          {publishedPosts.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                No blogs published yet
              </h3>
              <p className="text-slate-500">
                Upload a document above to generate your first blog post.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">
                      {post.summary}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <span className="text-xs font-bold text-slate-400">
                        {post.date}
                      </span>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-500 hover:text-white hover:bg-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
