const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { ExamController } = require('../controllers/ExamController')
const router = express.Router();

router.post('/create-exam', verifyToken, ExamController.CreateExam);

//router.put('/', ExamController.UpdateExam);

router.get('/get-exambyslug', verifyToken, ExamController.getExamBySlug);

module.exports = router;
