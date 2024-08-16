const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AuthController } = require('../controllers/AuthController')
const { UserController } = require('../controllers/UserController')
const router = express.Router();
/**
 * @swagger
 * /user/info:
 *   get:
 *     summary: Get a info from user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example:
 *               data: [{}]
 *       400:
 *         description: Bad Request
 *         content:
 *          application/json:
 *            example:
 *             error:
 *              message: "Bad Request"
 */
//Get All Students
router.get('/info', verifyToken, UserController.getInfo);

router.get('/info-short', verifyToken, UserController.getInfoShort);
router.put('/update-profile', verifyToken, UserController.updateUser);
router.put('/update-avatar', verifyToken, UserController.updateAvatar);
router.put('/reset-avatar', verifyToken, UserController.resetAvatar);
router.put('/change-password', verifyToken, UserController.updatePassword);
router.put('/update-device-token', verifyToken, UserController.updateDeviceToken);

router.put('/update-role', verifyToken, UserController.updateRoles)

router.delete('/', verifyTokenAdmin, UserController.deleteAccount)

router.get("/", verifyToken, UserController.searchUsers)

module.exports = router;