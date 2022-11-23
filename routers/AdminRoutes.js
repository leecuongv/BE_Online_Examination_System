const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { AdminController } = require('../controllers/AdminController')
const router = express.Router();

router.put("/active-user", verifyTokenAdmin, AdminController.activeUserByAdmin)
router.put("/inactive-user", verifyTokenAdmin, AdminController.inactiveUserByAdmin)
router.put("/update-user-role", verifyTokenAdmin, AdminController.updateUserRole)
router.delete("/delete-user-by-id", verifyTokenAdmin, AdminController.deleteUserById)
router.get("/list-user", verifyTokenAdmin, AdminController.GetListUser)
router.delete("/delete-course-by-id", verifyTokenAdmin, AdminController.deleteCourseById)
router.get("/list-course", verifyTokenAdmin, AdminController.GetListCourse)



module.exports = router