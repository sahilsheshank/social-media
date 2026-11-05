const { z } = require("zod");

// Unknown fields such as isAdmin or likes are stripped by these schemas, so they never reach the database.

const password = z
  .string()
  .min(8, "must be at least 8 characters")
  // bcrypt silently ignores everything after 72 bytes.
  .refine((value) => Buffer.byteLength(value) <= 72, "must be at most 72 bytes");

const username = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_.]{3,20}$/, "must be 3-20 letters, numbers, dots or underscores");

const email = z.string().trim().toLowerCase().max(254).pipe(z.email("must be a valid email"));

// Stored images are referenced by relative path, e.g. "uuid.jpg" or "persons/1.jpeg".
const imagePath = z
  .string()
  .max(200)
  .regex(/^[A-Za-z0-9_-][\w.-]*(\/[\w.-]+)*$/, "is not a valid image path")
  .refine((value) => !value.includes(".."), "is not a valid image path");

const registerSchema = z.object({ username, email, password });

const loginSchema = z.object({
  email: z.string().trim().max(254),
  password: z.string().max(1000),
});

const updateUserSchema = z.object({
  username: username.optional(),
  email: email.optional(),
  password: password.optional(),
  currentPassword: z.string().max(1000).optional(),
  profilePicture: imagePath.or(z.literal("")).optional(),
  coverPicture: imagePath.or(z.literal("")).optional(),
  desc: z.string().trim().max(160).optional(),
  city: z.string().trim().max(50).optional(),
  from: z.string().trim().max(50).optional(),
  relationship: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

const userLookupSchema = z
  .object({
    userId: z.string().max(64).optional(),
    username: z.string().max(64).optional(),
  })
  .refine((query) => query.userId || query.username, "userId or username is required");

const postDesc = z.string().trim().max(500);

const createPostSchema = z
  .object({ desc: postDesc.optional(), img: imagePath.optional() })
  .refine((post) => post.desc || post.img, "A post needs text or an image");

const updatePostSchema = z.object({ desc: postDesc.optional(), img: imagePath.optional() });

const commentSchema = z.object({ comment: z.string().trim().min(1, "cannot be empty").max(500) });

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  userLookupSchema,
  createPostSchema,
  updatePostSchema,
  commentSchema,
};
