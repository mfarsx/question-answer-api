const User = require("../models/User");
const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");
const { sendJwtToClient } = require("../helpers/auth/tokenHelpers");
const {
  valideUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers");
const { sendEmail } = require("../helpers/libraries/sendEmail");
const { isSmtpConfigured } = require("../helpers/config/env");

const register = asyncErrorWrapper(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
  });

  sendJwtToClient(user, res);
});

const login = asyncErrorWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!valideUserInput(email, password)) {
    return next(new CustomError("Please check your inputs", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new CustomError("Please check your inputs", 400));
  }

  if (!comparePassword(password, user.password)) {
    return next(new CustomError("Please check your inputs", 400));
  }

  sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
  const { NODE_ENV } = process.env;

  return res
    .status(200)
    .clearCookie("access_token", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({
      success: true,
      message: "Logout Successfull",
    });
});

const getUser = (req, res, next) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    },
  });
};

const imageUpload = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      profile_image: req.savedProfileImage,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Image Upload Successfull",
    data: user,
  });
});

const forgotPassword = asyncErrorWrapper(async (req, res, next) => {
  const resetEmail = req.body.email;

  if (!isSmtpConfigured()) {
    return res.status(200).json({
      success: false,
      message: "Password reset is currently unavailable",
    });
  }

  const genericMessage = "If the email exists in our system, you will receive a reset link shortly.";

  const user = await User.findOne({ email: resetEmail });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  }

  const resetPasswordToken = user.getResetPasswordTokenFromUser();
  await user.save({ validateBeforeSave: false });

  const resetBaseUrl =
    process.env.RESET_PASSWORD_CLIENT_URL ||
    `${req.protocol}://${req.get("host")}/api/auth/resetpassword`;
  const resetPasswordUrl = `${resetBaseUrl}?resetPasswordToken=${resetPasswordToken}`;

  const emailTemplate = `
  <h3>Reset Your Password</h3>
  <p> This <a href = '${resetPasswordUrl}' target = '_blank'>link<a/> will expire in 1 hour</p>
  `;

  try {
    await sendEmail({
      from: process.env.SMTP_USER,
      to: resetEmail,
      subject: "Reset Your Password",
      html: emailTemplate,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json({
    success: true,
    message: genericMessage,
  });
});

const resetPassword = asyncErrorWrapper(async (req, res, next) => {
  const resetPasswordToken = req.body.resetPasswordToken || req.query.resetPasswordToken;
  const { password } = req.body;

  if (!resetPasswordToken) {
    return next(new CustomError("Please provide a valid token", 400));
  }

  let user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new CustomError("Invalid Token Or Session Expired", 400));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Reset password process successful",
  });
});

const editDetails = asyncErrorWrapper(async (req, res, next) => {
  // Email bu endpoint üzerinden değiştirilemez
  const allowedFields = ["name", "title", "about", "place", "website"];
  const editInformation = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      editInformation[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, editInformation, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  register,
  getUser,
  login,
  logout,
  imageUpload,
  forgotPassword,
  resetPassword,
  editDetails,
};
