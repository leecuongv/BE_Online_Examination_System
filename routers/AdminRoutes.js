const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AdminController } = require('../controllers/AdminController')
const router = express.Router();

router.put("/active-user", verifyToken, AdminController.activeUserByAdmin)
router.put("/inactive-user", verifyToken, AdminController.inactiveUserByAdmin)
router.put("/update-user-role", verifyToken, AdminController.updateUserRole)
router.delete("/delete-user-by-id", verifyToken, AdminController.deleteUserById)
router.get("/list-user", verifyToken, AdminController.GetListUser)
router.delete("/delete-course-by-id", verifyToken, AdminController.deleteCourseById)
router.get("/list-course", verifyToken, AdminController.GetListCourse)



module.exports = router