const express = require('express')
const { verifyToken } = require("../controllers/middlewareController")
const { QuestionBankController } = require('../controllers/QuestionBankController')
const router = express.Router();

router.post('', verifyToken, QuestionBankController.CreateQuestionBank);

router.put('/', verifyToken, QuestionBankController.UpdateQuestionBank);

router.get('', verifyToken, QuestionBankController.getQuestionBankBySlug);

router.get('/by-teacher', verifyToken, QuestionBankController.getListQuestionBankByTeacher);

router.get('/questions', verifyToken, QuestionBankController.getListQuestionOfQuestionBank);

router.post('/questions-by-slugs', verifyToken, QuestionBankController.getListQuestionByListQB);

router.post('/add-question', verifyToken, QuestionBankController.addQuestionIntoQuestionBank);

router.post("/update-question", verifyToken, QuestionBankController.UpdateQuestionInQuestionBank)

router.delete("/delete-question", verifyToken, QuestionBankController.DeleteQuestionInQuestionBank)

module.exports = router;
