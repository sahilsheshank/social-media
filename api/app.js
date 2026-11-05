const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const config = require("./config");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const uploadRoute = require("./routes/upload");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();

app.set("trust proxy", config.trustProxy);

app.use(helmet());
app.use(morgan("common"));
app.use(cors({ origin: config.clientOrigins, credentials: true }));

// Images may be shown by the client even when it runs on a different origin.
app.use(
  "/images",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(config.uploadDir)
);

app.use("/api", apiLimiter);
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/upload", uploadRoute);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
