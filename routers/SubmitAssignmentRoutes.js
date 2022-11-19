const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { SubmitAssignmentController } = require('../controllers/SubmitAssignmentController')
const router = express.Router();

router.post('/create', verifyToken, SubmitAssignmentController.Create);

router.put('/update', verifyToken, SubmitAssignmentController.Update);
router.delete('/', verifyToken, SubmitAssignmentController.Delete);
router.put("/marking", verifyToken, SubmitAssignmentController.Marking)
router.get("by-id", verifyToken, SubmitAssignmentController.GetSubmitAssignmentById)

//router.get('/assignment-by-course-of-teacher', verifyToken, AssignmentController.getAssignmentByCourseOfTeacher)

//router.get('/assignment-by-course-of-student', verifyToken, AssignmentController.getAssignmentByCourseOfStudent)

//router.get('/by-slug', verifyToken, AssignmentController.getAssignmentBySlug);
//router.get("/add-question-with-questionbank", verifyToken, ExamController.addQuestionWithQuestionBank)

//router.put('/public', verifyToken, AssignmentController.PublicAssignment)
//router.put('/close', verifyToken, AssignmentController.CloseAssignment)

module.exports = router;