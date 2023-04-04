const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AuthController } = require('../controllers/AuthController')
const router = express.Router();
const passport = require('passport')

router.post('/register', AuthController.RegisterUser);

router.post('/login', AuthController.LoginUser);
router.post('/login-admin', AuthController.LoginAdmin);


router.post('/refreshtoken', AuthController.RefreshToken);

router.post('/reactive', AuthController.ReActive);

router.post('/active', AuthController.Active);

router.put('/activebyadmin', verifyTokenAdmin, AuthController.activeByAdmin);

router.put('/inactivebyadmin', verifyTokenAdmin, AuthController.inactiveByAdmin);

router.get('/verifytoken', AuthController.verifyToken);

router.get('/reset-password', AuthController.Forgotpassword);

router.post('/reset-password', AuthController.ResetPassword);

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
)
module.exports =  router;