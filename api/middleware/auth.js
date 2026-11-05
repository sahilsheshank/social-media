const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { HttpError } = require("./errors");
const { jwtSecret, isProduction } = require("../config");

const COOKIE_NAME = "token";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // Lax stops other sites from sending this cookie on POST/PUT/DELETE requests.
  sameSite: "lax",
  path: "/",
};

const setSessionCookie = (res, user) => {
  const token = jwt.sign({ sub: user.id, v: user.tokenVersion }, jwtSecret, {
    algorithm: "HS256",
    expiresIn: SESSION_MS / 1000,
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_MS });
};

const clearSessionCookie = (res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
};

const requireAuth = async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) throw new HttpError(401, "Please log in");

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch {
    clearSessionCookie(res);
    throw new HttpError(401, "Please log in");
  }

  // Loading the user means deleted accounts and old sessions stop working immediately.
  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (!user || user.tokenVersion !== payload.v) {
    clearSessionCookie(res);
    throw new HttpError(401, "Please log in");
  }

  req.user = user;
  next();
};

const assertSelfOrAdmin = (req, ownerId, message) => {
  if (req.user.id !== String(ownerId) && !req.user.isAdmin) {
    throw new HttpError(403, message);
  }
};

module.exports = { requireAuth, assertSelfOrAdmin, setSessionCookie, clearSessionCookie };
