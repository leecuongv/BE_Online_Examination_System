import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import {verifyToken, verifyTokenAdmin} from "../controllers/middlewareController.js"

const router = express.Router();

router.post('/auth/register', AuthController.RegisterUser);

router.post('/auth/login', AuthController.LoginUser);

router.get('/getusers',verifyToken,AuthController.LoadUsers);

router.post('/auth/refreshtoken',AuthController.RefreshToken);

router.post('/auth/reactive',AuthController.ReActive);

router.get('/auth/active',AuthController.Active);

router.put('/auth/activebyadmin',verifyTokenAdmin,AuthController.activeByAdmin);

router.put('/auth/inactivebyadmin',verifyTokenAdmin,AuthController.inactiveByAdmin);

router.get('/auth/verifytoken',AuthController.verifyToken);

router.post('/auth/forgetpassword',AuthController.Forgotpassword);

router.post('/auth/checkusername',AuthController.checkUsername);

router.post('/auth/checkemail',AuthController.checkEmail);

export default router;