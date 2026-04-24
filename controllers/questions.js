const Question = require("../models/Question");
const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");

const askNewQuestion = asyncErrorWrapper(async (req, res, next) => {
  const information = req.body;

  const question = await Question.create({
    ...information,
    user: req.user.id,
  });
  return res.status(200).json({
    success: true,
    data: question,
  });
});

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getAllQuestions = asyncErrorWrapper(async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  const [questions, total] = await Promise.all([
    Question.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Question.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: questions,
  });
});

const getSingleQuestion = asyncErrorWrapper(async (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: req.question,
  });
});

const editQuestion = asyncErrorWrapper(async (req, res, next) => {
  const editInformation = req.body;

  const question = await Question.findByIdAndUpdate(
    req.question.id,
    editInformation,
    {
      new: true,
      runValidators: true,
    }
  );
  return res.status(200).json({
    success: true,
    data: question,
  });
});

const deleteQuestion = asyncErrorWrapper(async (req, res, next) => {
  await req.question.remove();

  return res.status(200).json({
    success: true,
    message: "Delete Operation Successful",
  });
});

const likeUndoLikeQuestion = asyncErrorWrapper(async (req, res, next) => {
  const userId = req.user.id;
  const alreadyLiked = req.question.likes.some(
    (like) => String(like) === userId
  );

  if (alreadyLiked) {
    req.question.likes = req.question.likes.filter(
      (like) => String(like) !== userId
    );
  } else {
    req.question.likes.push(userId);
  }

  await req.question.save();

  return res.status(200).json({
    success: true,
    message: "Like-UndoLike Operation Successful",
  });
});

module.exports = {
  askNewQuestion,
  getAllQuestions,
  getSingleQuestion,
  editQuestion,
  deleteQuestion,
  likeUndoLikeQuestion,
};
