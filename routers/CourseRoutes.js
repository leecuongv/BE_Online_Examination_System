import express from 'express';
import { CourseController } from '../controllers/CourseController.js';
import { verifyToken, verifyTokenAdmin } from "../controllers/middlewareController.js"
const router = express.Router();

router.post('/', CourseController.CreateCourse);

router.put('/', CourseController.UpdateCourse);

router.get('', CourseController.getCourseBySlug);

export default router;