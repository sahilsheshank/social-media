const router = require("express").Router();
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const { HttpError } = require("../middleware/errors");
const { requireAuth } = require("../middleware/auth");
const { uploadLimiter } = require("../middleware/rateLimit");
const { uploadDir } = require("../config");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Checks the file's actual bytes, because the name and type sent by the browser can be faked.
const detectImageExtension = (buffer) => {
  const startsWith = (bytes, offset = 0) =>
    buffer.subarray(offset, offset + bytes.length).equals(Buffer.from(bytes));

  if (startsWith([0xff, 0xd8, 0xff])) return ".jpg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return ".png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return ".webp";
  return null;
};

router.post("/", requireAuth, uploadLimiter, upload.single("file"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "No file uploaded");

  const extension = detectImageExtension(req.file.buffer);
  if (!extension) throw new HttpError(400, "Only JPEG, PNG and WebP images are allowed");

  // The server picks the name, so client input can never choose where the file is written.
  const filename = crypto.randomUUID() + extension;
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), req.file.buffer);

  res.status(201).json({ filename });
});

module.exports = router;
