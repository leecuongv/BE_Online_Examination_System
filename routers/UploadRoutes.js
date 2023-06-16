const express = require('express')
const { verifyToken } = require("../controllers/middlewareController")
const { UploadController } = require('../controllers/UploadController')
const router = express.Router();

router.post("/image",verifyToken,UploadController.UploadImage)
router.post('/file',verifyToken, UploadController.Upload);
router.post('/up-file',verifyToken, UploadController.UploadFile);
router.get('/download-file',verifyToken, UploadController.Download);
router.get('/download-deta', UploadController.DownloadDeta);
module.exports = router;
