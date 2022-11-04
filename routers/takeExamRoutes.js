const express = require("express");
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { TakeExamController } = require('../controllers/TakeExamController')
const router = express.Router();

router.post('/take-exam', verifyToken, TakeExamController.CreateTakeExam);
router.post('/check-takeexamid', verifyToken, TakeExamController.CheckTakeExamId);
router.post('/check-exam', verifyToken, TakeExamController.CheckExam);
router.post('/submit-exam', verifyToken, TakeExamController.submitAnswerSheet);

module.exports = router;
