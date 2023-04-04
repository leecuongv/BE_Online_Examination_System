const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { QuestionController } = require('../controllers/QuestionController')
const router = express.Router();

router.post('/create-question', verifyToken, QuestionController.CreateQuestion);
router.delete('', verifyToken, QuestionController.DeleteQuestion);
router.delete('/question-bank', verifyToken, QuestionController.DeleteQuestionInQuestionBank);
router.post("/create-question-by-file", verifyToken, QuestionController.CreateQuestionByFile)
router.post("/update-question-in-exam", verifyToken, QuestionController.UpdateQuestionInExam)
module.exports = router;
