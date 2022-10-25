const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { ExamController } = require('../controllers/ExamController')
const router = express.Router();

router.post('/', ExamController.CreateExam);

router.put('/', ExamController.UpdateExam);

router.get('', ExamController.getExamBySlug);

module.exports = router;