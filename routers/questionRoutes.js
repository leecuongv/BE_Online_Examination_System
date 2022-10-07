const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const verifyToken = require("../controllers/middlewareController");
const dotenv = require("dotenv");
const { ROLES, STATUS } = require("../utils/enum");
const { formatTimeUTC_, formatTimeUTC } = require("../utils/Timezone");
dotenv.config({ path: "./.env" });

router.get("/", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const questions = await Question.find()
      .populate("answers")
      .populate("correctAnswers")
      .exec();
    if (questions) {
      res.json({
        success: true,
        message: "Get all question successfully ",
        questions,
      });
    } else {
      res.json({
        success: false,
        message: "Questions do not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/questions/:questionId
//@desc get answers by id
//@access private
//@role admin/creator/user
router.get("/:questionId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const question = await Question.findById(req.params.questionId)
      .select("-correctAnswers")
      .exec();

    if (question) {
      res.json({
        success: true,
        message: "Get question by id successfully ",
        data: question,
      });
    } else {
      res.json({
        success: false,
        message: "Question does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route Post v1/questions/new/:testId
//@desc Create a question
//@access private
//@role admin/creator
router.post("/new/:testId", verifyToken, async (req, res) => {
  try {
    //Check permission

    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    //Create new question
    let question = new Question({
      content: req.body.content,
      type: req.body.type,
      answers: req.body.answers,
      correctAnswers: req.body.correctAnswers,
      embededMedia: req.body.embededMedia,
      maxPoints: req.body.maxPoints,
      _status: req.body._status,
    });

    //Send to Database
    question = await question.save();
    //TODO: Updating for Exam Collection : Question list
    let exam = await Exam.findById(req.params.testId);

    if (exam) {
      exam.questions.push(question.id.toString());
      exam = await Exam.findByIdAndUpdate(exam.id, exam, { new: true })
        .populate("questions")
        .populate({
          path: "questions",
          populate: {
            path: "answers"
          }
        })
        .exec();
    }

    res.json({
      success: true,
      message: "Question created successfully",
      question: question,
      exam: exam
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route PUT v1/questions/:questionId
//@desc Update a question by question Id
//@access private
//@role admin/creator
router.put("/:questionId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    let question;
    question = {
      content: req.body.content,
      type: req.body.type,
      answers: req.body.answers,
      correctAnswers: req.body.correctAnswers,
      embededMedia: req.body.embededMedia,
      updatedAt: new Date(), // formatTimeUTC(),
      _status: req.body._status,
      maxPoints: req.body.maxPoints,
    };

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.questionId,
      question,
      { new: true }
    ).populate("answers")
      .exec();

    res.json({
      success: true,
      message: "Update question successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route PUT v1/questions/:questionId/delete
//@desc Delete a question by question Id
//@access private
//@role admin/creator
router.put("/:questionId/delete", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const deleteQuestion = await Question.findByIdAndDelete(req.params.questionId);
    res.json({
      success: true,
      message: "Delete question successfully",
      question: deleteQuestion,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/questions/:questionId/answers
//@desc get all answers by question id
//@access private
//@role admin/creator/user
router.get("/:questionId/answers", verifyToken, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).populate(
      "answers"
    );
    if (question) {
      res.json({
        success: true,
        message: "Get all answers by question id successfully ",
        answers: question.answers,
      });
    } else {
      res.json({
        success: false,
        message: "Answers does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
