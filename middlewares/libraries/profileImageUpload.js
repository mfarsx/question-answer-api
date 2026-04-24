const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CustomError = require("../../helpers/error/CustomError");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const rootDir = path.dirname(require.main.filename);
    const uploadPath = path.join(rootDir, "public/uploads");

    fs.mkdirSync(uploadPath, { recursive: true });
    callback(null, uploadPath);
  },
  filename: function (req, file, callback) {
    const extension = file.mimetype.split("/")[1];
    req.savedProfileImage = "image_" + req.user.id + "." + extension;
    callback(null, req.savedProfileImage);
  },
});
const fileFilter = (req, file, callback) => {
  let allowedMimeTypes = ["image/jpg", "image/gif", "image/jpeg", "image/png"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new CustomError("Please provide a valid image file", 400),
      false
    );
  }
  return callback(null, true);
};

const profileImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = {
  profileImageUpload,
};
