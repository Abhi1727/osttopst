import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "gzip",
      ext: ".gz",
    }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react-router") || id.includes("@remix-run")) {
              return "vendor-router";
            }
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler")
            ) {
              return "vendor-react-core";
            }
            if (id.includes("@clerk")) {
              return "vendor-clerk";
            }
            if (id.includes("@radix-ui") || id.includes("radix-ui")) {
              return "vendor-ui-radix";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("date-fns") || id.includes("dompurify")) {
              return "vendor-utils";
            }
            // Group other stable node_modules together
            return "vendor-others";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
