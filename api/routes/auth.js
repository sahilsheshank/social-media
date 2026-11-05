const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { HttpError } = require("../middleware/errors");
const { requireAuth, setSessionCookie, clearSessionCookie } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");
const { registerSchema, loginSchema } = require("../validation/schemas");

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("no-account-has-this-password", BCRYPT_ROUNDS);

router.post("/register", registerLimiter, async (req, res) => {
  const { username, email, password } = registerSchema.parse(req.body);
  const user = await User.create({
    username,
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
  });
  res.status(201).json(user);
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  // New accounts store lowercase emails. Older accounts may keep their original casing.
  const user = await User.findOne({ email: { $in: [email, email.toLowerCase()] } }).select(
    "+password +tokenVersion"
  );
  const validPassword = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !validPassword) throw new HttpError(401, "Invalid email or password");

  setSessionCookie(res, user);
  res.status(200).json(user);
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ message: "Logged out" });
});

router.get("/me", requireAuth, (req, res) => {
  res.status(200).json(req.user);
});

module.exports = router;
module.exports.BCRYPT_ROUNDS = BCRYPT_ROUNDS;
