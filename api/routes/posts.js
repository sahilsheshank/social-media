const router = require("express").Router();
const Post = require("../models/post");
const User = require("../models/user");
const { HttpError } = require("../middleware/errors");
const { requireAuth, assertSelfOrAdmin } = require("../middleware/auth");
const { createPostSchema, updatePostSchema, commentSchema } = require("../validation/schemas");

const findPost = async (id) => {
  const post = await Post.findById(id);
  if (!post) throw new HttpError(404, "Post not found");
  return post;
};

router.use(requireAuth);

router.post("/", async (req, res) => {
  const post = await Post.create({ ...createPostSchema.parse(req.body), userId: req.user.id });
  res.status(201).json(post);
});

// Declared before "/:id" so that "timeline" isn't treated as a post id.
router.get("/timeline", async (req, res) => {
  const posts = await Post.find({ userId: { $in: [req.user.id, ...req.user.followings] } }).sort({
    createdAt: -1,
  });
  res.status(200).json(posts);
});

router.get("/profile/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }).select("_id");
  if (!user) throw new HttpError(404, "User not found");
  const posts = await Post.find({ userId: user.id }).sort({ createdAt: -1 });
  res.status(200).json(posts);
});

router.get("/:id", async (req, res) => {
  res.status(200).json(await findPost(req.params.id));
});

router.put("/:id", async (req, res) => {
  const post = await findPost(req.params.id);
  assertSelfOrAdmin(req, post.userId, "You can update only your post");
  post.set(updatePostSchema.parse(req.body));
  await post.save();
  res.status(200).json(post);
});

router.delete("/:id", async (req, res) => {
  const post = await findPost(req.params.id);
  assertSelfOrAdmin(req, post.userId, "You can delete only your post");
  await post.deleteOne();
  res.status(200).json({ message: "The post has been deleted" });
});

router.put("/:id/like", async (req, res) => {
  const post = await findPost(req.params.id);
  const liked = post.likes.includes(req.user.id);
  await post.updateOne(liked ? { $pull: { likes: req.user.id } } : { $addToSet: { likes: req.user.id } });
  res.status(200).json({ liked: !liked });
});

router.put("/:id/comment", async (req, res) => {
  const { comment } = commentSchema.parse(req.body);
  const post = await findPost(req.params.id);
  await post.updateOne({ $push: { comments: comment } });
  res.status(200).json({ message: "Comment added" });
});

router.get("/:id/comments", async (req, res) => {
  const post = await findPost(req.params.id);
  res.status(200).json(post.comments);
});

module.exports = router;
