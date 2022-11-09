const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { CourseController } = require('../controllers/CourseController');
// const { UploadController } = require('../controllers/UploadController');
const router = express.Router();

router.post('',verifyToken, CourseController.CreateCourse);

router.put('/', CourseController.UpdateCourse);

router.get('', CourseController.getCourseBySlug);

router.get('/by-courseid', CourseController.getCourseByCourseId);

router.get('/by-teacher',verifyToken, CourseController.getListCourseTeacher);

router.get('/search-student',verifyToken, CourseController.searchListStudentToAdd);
router.get('/get-students',verifyToken, CourseController.getListStudentOfCourse);
router.get('/get-exams',verifyToken, CourseController.getListExamOfCourse);

router.post('/add-student',verifyToken, CourseController.addStudentIntoCourse);
router.delete('/delete-student',verifyToken, CourseController.deleteStudentInCourse);
router.post('/update-course',verifyToken, CourseController.UpdateCourse);
// router.post('/update-file',verifyToken, UploadController.Upload);
// router.get('/download-file', UploadController.Download);

module.exports = router;
