const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { BillController } = require('../controllers/BillController')
const router = express.Router();

router.post("/create-payment/vnpay",verifyToken,BillController.CreatePaymentVNPay)
router.get("/vnpay-return",BillController.VNPayIPN)

module.exports = router;
