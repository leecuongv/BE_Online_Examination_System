const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { CourseController } = require('../controllers/CourseController')
const router = express.Router();

router.post('', CourseController.CreateCourse);

router.put('/', CourseController.UpdateCourse);

router.get('', CourseController.getCourseBySlug);
router.get('/by-courseid', CourseController.getCourseByCourseId);
router.get('/by-teacher',verifyToken, CourseController.getListCourseTeacher);
router.get('/search-student',verifyToken, CourseController.searchListStudentToAdd);

module.exports = router;
