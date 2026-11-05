const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { HttpError } = require("../middleware/errors");
const {
  requireAuth,
  assertSelfOrAdmin,
  setSessionCookie,
  clearSessionCookie,
} = require("../middleware/auth");
const { BCRYPT_ROUNDS } = require("./auth");
const { updateUserSchema, userLookupSchema } = require("../validation/schemas");

// What other users may see. Email and admin status stay private.
const PUBLIC_FIELDS =
  "username profilePicture coverPicture followers followings desc city from relationship createdAt";

router.use(requireAuth);

router.put("/:id", async (req, res) => {
  assertSelfOrAdmin(req, req.params.id, "You can update only your account");
  const { password, currentPassword, ...changes } = updateUserSchema.parse(req.body);

  const user = await User.findById(req.params.id).select("+password +tokenVersion");
  if (!user) throw new HttpError(404, "User not found");

  // Email and password changes need the account's own password, even from an admin.
  if (password || changes.email) {
    if (req.user.id !== user.id) {
      throw new HttpError(403, "You can change email or password only on your own account");
    }
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new HttpError(403, "Current password is incorrect");
    }
  }

  user.set(changes);
  if (password) {
    user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.tokenVersion += 1; // Log out all other sessions.
  }
  await user.save();

  if (password) setSessionCookie(res, user);
  res.status(200).json(user);
});

router.delete("/:id", async (req, res) => {
  assertSelfOrAdmin(req, req.params.id, "You can delete only your account");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new HttpError(404, "User not found");

  if (req.user.id === user.id) clearSessionCookie(res);
  res.status(200).json({ message: "Account has been deleted" });
});

router.get("/all", async (req, res) => {
  const users = await User.find({}, "username profilePicture").limit(100);
  res.status(200).json(users);
});

router.get("/", async (req, res) => {
  const { userId, username } = userLookupSchema.parse(req.query);
  const user = await (userId ? User.findById(userId) : User.findOne({ username })).select(
    PUBLIC_FIELDS
  );
  if (!user) throw new HttpError(404, "User not found");
  res.status(200).json(user);
});

router.get("/friends/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId).select("followings");
  if (!user) throw new HttpError(404, "User not found");
  const friends = await User.find({ _id: { $in: user.followings } }, "username profilePicture");
  res.status(200).json(friends);
});

router.put("/:id/follow", async (req, res) => {
  if (req.user.id === req.params.id) throw new HttpError(400, "You can't follow yourself");
  const target = await User.findByIdAndUpdate(req.params.id, {
    $addToSet: { followers: req.user.id },
  });
  if (!target) throw new HttpError(404, "User not found");
  await User.updateOne({ _id: req.user.id }, { $addToSet: { followings: req.params.id } });
  res.status(200).json({ message: "User has been followed" });
});

router.put("/:id/unfollow", async (req, res) => {
  if (req.user.id === req.params.id) throw new HttpError(400, "You can't unfollow yourself");
  const target = await User.findByIdAndUpdate(req.params.id, {
    $pull: { followers: req.user.id },
  });
  if (!target) throw new HttpError(404, "User not found");
  await User.updateOne({ _id: req.user.id }, { $pull: { followings: req.params.id } });
  res.status(200).json({ message: "User has been unfollowed" });
});

module.exports = router;
