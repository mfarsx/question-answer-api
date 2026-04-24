const CustomError = require("../../helpers/error/CustomError");
const customErrorHandlers = (err, req, res, next) => {
  let customErr = err;

  if (err.name === "SyntaxError") {
    customErr = new CustomError("Unexpected Syntax", 400);
  }
  if (err.name === "ValidationError") {
    customErr = new CustomError(err.message, 400);
  }
  if (err.code === 11000) {
    customErr = new CustomError("Duplicate Key Found : Check Your Input", 400);
  }
  if (err.name === "CastError") {
    customErr = new CustomError("Please provide a valid id", 400);
  }
  if (err.name === "MulterError") {
    customErr = new CustomError(err.message, 400);
  }

  res.status(customErr.status || 500).json({
    success: false,
    message: customErr.message || "Internal Server Error",
  });
};

module.exports = customErrorHandlers;
