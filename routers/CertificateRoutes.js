const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const {CertificateController}= require("../controllers/CertificateController")
const router = express.Router();
router.post("/create", verifyToken, CertificateController.Create)
router.get("/view", CertificateController.View)
module.exports = router;