const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { StatisticController } = require('../controllers/StatisticsController')
const router = express.Router();

router.get('/exam-by-student',verifyToken, StatisticController.GetTakeExamByStudent);
router.get('/exam-by-teacher',verifyToken, StatisticController.GetTakeExamByTeacher);
router.get('/exam-detail-by-teacher',verifyToken, StatisticController.GetTakeExamDetailByTeacher);
router.get('/submit-assignment-detail-by-teacher',verifyToken, StatisticController.GetSubmitAssignmentDetailByTeacher);
router.get("/number-of-courses", verifyTokenAdmin, StatisticController.GetNumberOfCourses);
router.get("/number-of-exams",verifyTokenAdmin, StatisticController.GetNumberOfExams)
router.get("/number-of-assignments",verifyTokenAdmin, StatisticController.GetNumberOfAssignments)
router.get("/number-of-users", verifyTokenAdmin, StatisticController.GetNumberOfUsers)
router.get("/total-new-users-by-day", verifyTokenAdmin, StatisticController.GetTotalNewUsersByDay)
router.get("/list-bills", verifyTokenAdmin, StatisticController.GetListBills)
router.get("/list-bill-by-user", verifyTokenAdmin, StatisticController.GetListBillByUser)
router.get("/sum-revenue", verifyTokenAdmin, StatisticController.GetSumRevenue)
router.get("/total-revenue-by-day", verifyTokenAdmin, StatisticController.GetTotalRevenueByDay)
router.get("/detail-of-users", verifyTokenAdmin, StatisticController.getDetailOfUsers)

module.exports = router;
