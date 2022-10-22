const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { BillController } = require('../controllers/BillController')
const router = express.Router();

router.get("/create_payment_vnpay",BillController.UICreatePaymentVNPay)
router.post("/create-payment/vnpay",verifyToken,BillController.CreatePaymentVNPay)
router.get("/vnpay-return",BillController.VNPayIPN)

module.exports = router;
