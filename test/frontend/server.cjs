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
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Gzip compression
app.use(compression());

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

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback: Serve index.html for any unknown routes
app.get(/.*/, (req, res) => {
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
