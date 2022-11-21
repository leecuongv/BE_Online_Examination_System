const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { StatisticController } = require('../controllers/StatisticsController')
const router = express.Router();

router.get('/exam-by-student',verifyToken, StatisticController.getTakeExamByStudent);
router.get('/exam-by-teacher',verifyToken, StatisticController.getTakeExamByTeacher);
router.get("/number-of-courses", verifyToken, StatisticController.getNumberOfCourses);
router.get("/number-of-exams",verifyToken, StatisticController.getNumberOfExams)
router.get("/number-of-users", verifyToken, StatisticController.getNumberOfUsers)
router.get("/total-new-users-by-day", verifyToken, StatisticController.GetTotalNewUsersByDay)
module.exports = router;
