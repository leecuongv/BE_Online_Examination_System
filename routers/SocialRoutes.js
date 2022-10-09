import express from 'express';
import { SocialController } from '../controllers/SocialController.js';
const router = express.Router();

router.post('/login-google', SocialController.LoginGoogle);

router.post('/login-facebook', SocialController.LoginFacebook);

export default router;