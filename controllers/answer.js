const Answer = require("../models/Answer");
const Question = require("../models/Question");
const asyncErrorWrapper = require("express-async-handler");
const CustomError = require("../helpers/error/CustomError");

const addNewAnswerToQuestion = asyncErrorWrapper(async (req, res, next) => {
  const information = req.body;

  const answer = await Answer.create({
    ...information,
    user: req.user.id,
    question: req.question.id,
  });

  return res.status(200).json({
    success: true,
    data: answer,
  });
});

const getAllAnswersByQuestion = asyncErrorWrapper(async (req, res, next) => {
  const questionId = req.params.question_id;
  const question = await Question.findById(questionId).populate("answers");

   if (!question) {
    return next(new CustomError("There is no such question with that id", 400));
  }

  const answers = question.answers;

  return res.status(200).json({
    success: true,
    count: answers.length,
    data: answers,
  });
});
module.exports = {
  addNewAnswerToQuestion,
  getAllAnswersByQuestion,
};
