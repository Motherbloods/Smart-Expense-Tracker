const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// ✅ Manual CORS Middleware - HARUS PERTAMA
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ["http://localhost:5173", "http://localhost:4173"];

  console.log("🔍 CORS Middleware Running");
  console.log("   Method:", req.method);
  console.log("   Path:", req.path);
  console.log("   Origin:", origin);

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    console.log("   ✅ Set origin:", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    console.log("   📋 OPTIONS - returning 204");
    return res.status(204).end();
  }

  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("✅ Utils.js loaded - CORS middleware active");

module.exports = app;
