const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const required = ["MONGO_URL", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const clientOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 8000,
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigins,
  // Number of reverse proxies in front of the API. Rate limiting needs this to see real client IPs.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  uploadDir: path.join(__dirname, "public", "images"),
};
