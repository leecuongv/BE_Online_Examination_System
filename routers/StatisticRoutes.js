const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { StatisticController } = require('../controllers/StatisticController')
const router = express.Router();

router.get('/exam-by-student',verifyToken, StatisticController.getTakeExamByStudent);
router.get('/exam-by-teacher',verifyToken, StatisticController.getTakeExamByTeacher);

module.exports = router;
