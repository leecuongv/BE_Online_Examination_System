import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { verifyToken, verifyTokenAdmin } from "../controllers/middlewareController.js"
import passport from 'passport'
const router = express.Router();

router.post('/auth/register', AuthController.RegisterUser);

router.post('/auth/login', AuthController.LoginUser);

router.get('/getusers', verifyToken, AuthController.LoadUsers);

router.post('/auth/refreshtoken', AuthController.RefreshToken);

router.post('/auth/reactive', AuthController.ReActive);

router.get('/auth/active', AuthController.Active);

router.put('/auth/activebyadmin', verifyTokenAdmin, AuthController.activeByAdmin);

router.put('/auth/inactivebyadmin', verifyTokenAdmin, AuthController.inactiveByAdmin);

router.get('/auth/verifytoken', AuthController.verifyToken);

router.post('/auth/forgetpassword', AuthController.Forgotpassword);

router.post('/auth/checkusername', AuthController.checkUsername);

router.post('/auth/checkemail', AuthController.checkEmail);

router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/auth/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect('/');
  }
);

export default router;