const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AssignmentController } = require('../controllers/AssignmentController')
const router = express.Router();

router.post('/create', verifyToken, AssignmentController.CreateAssignment);

router.put('/update', verifyToken, AssignmentController.UpdateAssignment);

router.get('/assignment-by-course-of-teacher', verifyToken, AssignmentController.getAssignmentByCourseOfTeacher)

router.get('/assignment-by-course-of-student', verifyToken, AssignmentController.getAssignmentByCourseOfStudent)

router.get('/by-slug', verifyToken, AssignmentController.getAssignmentBySlug);
//router.get("/add-question-with-questionbank", verifyToken, ExamController.addQuestionWithQuestionBank)

router.put('/public', verifyToken, AssignmentController.PublicAssignment)
router.put('/close', verifyToken, AssignmentController.CloseAssignment)

module.exports = router;
