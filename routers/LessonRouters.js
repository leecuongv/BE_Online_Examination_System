const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { LessonController } = require('../controllers/LessonController')
const router = express.Router();

router.post('/create', verifyToken, LessonController.Create);

router.put('/update', verifyToken, LessonController.Update);
router.delete('/', verifyToken, LessonController.Delete);

router.get('/lesson-by-course-of-teacher', verifyToken, LessonController.getLessonByCourseOfTeacher)


router.get('/by-slug', verifyToken, LessonController.getLessonBySlug);
router.put('/public', verifyToken, LessonController.Public)
router.put('/close', verifyToken, LessonController.Close)

module.exports = router;
