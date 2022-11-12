const express = require('express')
const { verifyToken } = require("../controllers/middlewareController")
const { UploadController } = require('../controllers/UploadController')
const router = express.Router();

router.post("/image",verifyToken,UploadController.UploadImage)
router.post('/file',verifyToken, UploadController.Upload);
router.get('/download-file',verifyToken, UploadController.Download);
module.exports = router;
