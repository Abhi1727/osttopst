const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const compression = require("compression");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || "http://127.0.0.1:5000";

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://*.clerk.accounts.dev",
        ],
        connectSrc: [
          "'self'",
          "https://*.clerk.accounts.dev",
          "http://127.0.0.1:5000",
          API_URL,
        ],
        imgSrc: ["'self'", "data:", "https://*.clerk.accounts.dev"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'", "https://*.clerk.accounts.dev"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Advanced Compression: Aggressive settings for maximum byte savings
app.use(
  compression({
    level: 9, // Maximum compression level
    threshold: 0, // Compress everything, even small files like index.html
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

// Proxy API requests to backend
app.use(
  createProxyMiddleware({
    pathFilter: "/api",
    target: API_URL,
    changeOrigin: true,
    secure: false,
    ws: true,
  }),
);

// Serve static files with aggressive caching (1 year for hashed assets)
app.use(
  express.static(path.join(__dirname, "dist"), {
    maxAge: "1y",
    immutable: true,
    index: false, // Don't serve index.html from here to avoid wrong headers
  }),
);

// SPA fallback: Serve index.html with NO CACHE to ensure users always get the latest version
app.get(/.*/, (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Global error handlers to debug crashes
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running heavily on port ${port}`);
    console.log(`Proxying /api requests to ${API_URL}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
    }
  });
};

// Global error handlers to debug crashes
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION:", reason);
});

startServer(PORT);
