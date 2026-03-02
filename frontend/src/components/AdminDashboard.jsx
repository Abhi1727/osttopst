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
} from "lucide-react";
import { toast } from "sonner";
import imgMigration from "../assets/blog/blog_email_migration_1772432378369.png";

const AdminDashboard = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, success, error
  const [extractedData, setExtractedData] = useState(null);
  const [blogMetadata, setBlogMetadata] = useState({
    title: "",
    category: "Data Migration",
    excerpt: "",
  });

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

    // Simulate API call for file processing
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Mock extracted data
      setExtractedData({
        content:
          "<h1>Extracted Content from " +
          file.name +
          "</h1><p>This is a professional prototype of the extracted content from your document. In a real implementation, the backend would parse the headings, images, and text from your PDF or Word file and convert it into high-quality HTML or Markdown for the blog.</p><h3>Key Takeaways</h3><ul><li>Automated extraction reduces manual entry.</li><li>Maintains original formatting logic.</li><li>SEO optimized structure.</li></ul>",
        wordCount: 450,
      });

      setBlogMetadata({
        title: file.name.replace(/\.[^/.]+$/, "").replace(/-/g, " "),
        category: "Data Migration",
        excerpt:
          "A deep dive into the technical details extracted from our latest research document...",
      });

      setUploadStatus("success");
      toast.success("Document processed successfully!");
    } catch (error) {
      setUploadStatus("error");
      toast.error("Failed to process document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = () => {
    const newPost = {
      id: Date.now(),
      title: blogMetadata.title,
      summary: blogMetadata.excerpt,
      category: blogMetadata.category,
      content: extractedData.content,
      author: "SEO Admin",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: "5 min read",
      image: imgMigration, // Defaulting to migration image for prototype
    };

    const savedPosts = localStorage.getItem("published_blogs");
    const parsed = savedPosts ? JSON.parse(savedPosts) : [];
    const updated = [newPost, ...parsed];
    localStorage.setItem("published_blogs", JSON.stringify(updated));

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
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              SEO <span className="text-emerald-600">Admin Panel</span>
            </h1>
            <p className="text-slate-500 font-medium">
              Upload documents to automatically generate professional blog
              posts.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
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
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload Content
              </h2>

              <div
                className={`relative group border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer
                  ${file ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"}`}
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
                    ${file ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"}`}
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
                  className="w-full mt-6 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Ready to Publish
                </h3>
                <p className="text-emerald-50/80 text-sm mb-6 leading-relaxed">
                  Your document has been processed. Review the metadata and
                  preview before pushing live.
                </p>
                <button
                  onClick={handlePublish}
                  className="w-full bg-white text-emerald-700 font-black py-4 rounded-2xl hover:bg-emerald-50 transition-all shadow-md active:scale-95"
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
                  <FileText className="w-6 h-6 text-emerald-600" />
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
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500/30 transition-all text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Category
                  </label>
                  <select
                    value={blogMetadata.category}
                    onChange={(e) =>
                      setBlogMetadata({
                        ...blogMetadata,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500/30 transition-all text-slate-700 font-medium"
                  >
                    <option>Data Migration</option>
                    <option>Security</option>
                    <option>Best Practices</option>
                    <option>Cloud Solutions</option>
                    <option>Productivity</option>
                    <option>Troubleshooting</option>
                  </select>
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
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500/30 transition-all text-slate-700 font-medium resize-none"
                ></textarea>
              </div>

              <div className="border-t border-slate-50 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Content Preview
                  </h3>
                  {extractedData && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      {extractedData.wordCount} Words Extracted
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 rounded-3xl p-8 min-h-[300px] border border-slate-100 prose prose-slate max-w-none">
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
      </div>
    </div>
  );
};

export default AdminDashboard;
