import express from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { verifyToken, verifyTokenAdmin } from "../controllers/middlewareController.js"
import passport from 'passport'
const router = express.Router();

router.post('/register', AuthController.RegisterUser);

router.post('/login', AuthController.LoginUser);

router.post('/refreshtoken', AuthController.RefreshToken);

router.post('/reactive', AuthController.ReActive);

router.get('/active', AuthController.Active);

router.put('/activebyadmin', verifyTokenAdmin, AuthController.activeByAdmin);

router.put('/inactivebyadmin', verifyTokenAdmin, AuthController.inactiveByAdmin);

router.get('/verifytoken', AuthController.verifyToken);

router.post('/forgetpassword', AuthController.Forgotpassword);

router.post('/checkusername', AuthController.checkUsername);

router.post('/checkemail', AuthController.checkEmail);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect('/');
  }
);

export default router;