const User = require("../models/User");
const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");

const getSingleUser = asyncErrorWrapper(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: req.foundUser,
  });
});

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getAllUsers = asyncErrorWrapper(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: users,
  });
});

module.exports = {
  getSingleUser,
  getAllUsers
};
