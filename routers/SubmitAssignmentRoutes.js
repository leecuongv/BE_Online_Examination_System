const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { SubmitAssignmentController } = require('../controllers/SubmitAssignmentController')
const router = express.Router();

router.post('/create', verifyToken, SubmitAssignmentController.Create);

router.put('/update', verifyToken, SubmitAssignmentController.Update);
router.delete('/', verifyToken, SubmitAssignmentController.Delete);
router.put("/mark", verifyToken, SubmitAssignmentController.Mark)
router.get("/by-id", verifyToken, SubmitAssignmentController.GetSubmitAssignmentById)

router.get("/by-assignment-slug", verifyToken, SubmitAssignmentController.GetSubmitAssignmentByAssignmentSlug)


module.exports = router;