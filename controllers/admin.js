const User = require("../models/User");
const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");

const blockUser = asyncErrorWrapper(async (req, res, next) => {
  req.foundUser.blocked = !req.foundUser.blocked;
  await req.foundUser.save();
  
  return res.status(200).json({
    success: true,
    message : "Block - UnBlock Successful"
  });
});

const deleteUser = asyncErrorWrapper(async (req, res, next) => {
  await req.foundUser.remove();
  
  return res.status(200).json({
    success: true,
    message : "Delete Operation Successful"
  });
});

module.exports = {
  blockUser,
  deleteUser
};
