import React from "react";

const Blogs = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Our <span className="text-emerald-600">Blogs</span>
        </h1>
        <p className="text-slate-500 text-lg">
          Stay updated with the latest news, tutorials, and tips on OST to PST
          conversion.
        </p>

        <div className="grid gap-8 mt-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-slate-100 rounded-2xl mb-6 flex items-center justify-center text-slate-300">
                Main Image {i}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Understanding OST and PST File Formats
              </h2>
              <p className="text-slate-500 mb-6 font-medium">
                Learn the core differences between Outlook Offline Storage Table
                (OST) and Personal Storage Table (PST) files...
              </p>
              <button className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                Read More →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
