const CustomError = require("../../helpers/error/CustomError");
const jwt = require("jsonwebtoken");
const asyncErrorWrapper = require("express-async-handler");
const User = require("../../models/User");
const {
  isTokenIncluded,
  getAccessToken,
} = require("../../helpers/auth/tokenHelpers");

const getAccessToRoute = asyncErrorWrapper(async (req, res, next) => {
  const { JWT_SECRET_KEY: jwtSecretKey } = process.env;

  if (!jwtSecretKey) {
    return next(new CustomError("JWT secret is not configured", 500));
  }

  if (!isTokenIncluded(req)) {
    return next(new CustomError("You are not authorized to access this route", 401));
  }

  const accessToken = getAccessToken(req);
  let decoded;

  try {
    decoded = jwt.verify(accessToken, jwtSecretKey, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return next(new CustomError("You are not authorized to access this route", 401));
  }

  const user = await User.findById(decoded.id).select("name role blocked");

  if (!user) {
    return next(new CustomError("User no longer exists", 401));
  }

  if (user.blocked) {
    return next(new CustomError("Your account is blocked", 403));
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    role: user.role,
    blocked: user.blocked,
  };

  next();
});

const getAdminAccess = asyncErrorWrapper(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new CustomError("You are not authorized to access this route", 403));
  }
  next();
});

const getQuestionOwnerAccess = asyncErrorWrapper(async (req, res, next) => {
  if (req.user.id !== String(req.question.user)) {
    return next(
      new CustomError("You are not auth to access this question", 403)
    );
  }
  next();
});

module.exports = {
  getAccessToRoute,
  getAdminAccess,
  getQuestionOwnerAccess,
};
