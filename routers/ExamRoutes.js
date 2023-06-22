const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { ExamController } = require('../controllers/ExamController')
const router = express.Router();

router.post('/create-exam', verifyToken, ExamController.CreateExam);

router.put('/update-exam', verifyToken, ExamController.UpdateExam);

router.get('/get-exambyslug', verifyToken, ExamController.getExamBySlugTeacher);

router.get('/exam-by-student', verifyToken, ExamController.getExamBySlugByStudent);

router.post("/add-question-with-questionbank", verifyToken, ExamController.addQuestionWithQuestionBank)

router.put('/public-exam', verifyToken, ExamController.PublicExam)

router.put('/close-exam', verifyToken, ExamController.CloseExam)

router.post("/create-question-with-questionbank", verifyToken, ExamController.createQuestionWithQuestionBank)



module.exports = router;
