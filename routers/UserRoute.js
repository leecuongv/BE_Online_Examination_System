const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AuthController } = require('../controllers/AuthController')
const { UserController } = require('../controllers/UserController')
const router = express.Router();

router.get('/info', verifyToken, UserController.getInfo);
router.get('/info-short', verifyToken, UserController.getInfoShort);
router.put('/update-profile',verifyToken, UserController.updateUser);
router.put('/update-avatar',verifyToken, UserController.updateAvatar);
router.put('/reset-avatar',verifyToken, UserController.resetAvatar);
router.put('/change-password',verifyToken, UserController.updatePassword);
router.put('/update-device-token',verifyToken, UserController.updateDeviceToken);

router.put('/update-role',verifyToken,UserController.updateRoles)

router.delete('/',verifyTokenAdmin,UserController.deleteAccount)

router.get("/", verifyToken, UserController.searchUsers)

module.exports = router;