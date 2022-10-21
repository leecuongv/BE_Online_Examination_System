const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { BillController } = require('../controllers/BillController')
const router = express.Router();

router.get("/create_payment_vnpay",BillController.UICreatePaymentVNPay)

module.exports = router;
