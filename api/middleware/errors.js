const { ZodError } = require("zod");
const multer = require("multer");
const mongoose = require("mongoose");

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (req, res) => {
  res.status(404).json({ message: "Not found" });
};

// Express needs all four arguments to treat this as an error handler.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join(".");
    return res.status(400).json({ message: field ? `${field}: ${issue.message}` : issue.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid id" });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Username or email is already taken" });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Invalid upload";
    return res.status(400).json({ message });
  }
  if (err.type === "entity.parse.failed" || err.type === "entity.too.large") {
    return res.status(err.status).json({ message: "Invalid request body" });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
};

module.exports = { HttpError, notFound, errorHandler };
