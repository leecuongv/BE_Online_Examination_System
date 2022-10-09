const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { CourseController } = require('../controllers/CourseController')
const router = express.Router();

router.post('/', CourseController.CreateCourse);

router.put('/', CourseController.UpdateCourse);

router.get('', CourseController.getCourseBySlug);

module.exports = router;