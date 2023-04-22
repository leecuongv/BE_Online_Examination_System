const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { BillController } = require('../controllers/BillController')
const router = express.Router();

router.post("/create-payment/vnpay", verifyToken, BillController.CreatePaymentVNPay)
router.get("/vnpay-return", BillController.VNPayIPN)

router.post("/create-payment/momo", verifyToken, BillController.createPaymentMomo)
router.post("/upgrade-momo", BillController.upgradeAccountWithMomo)

router.post("/withdraw-money", verifyToken, BillController.WithdrawMoney)
router.post("/pay-in/vnpay", verifyToken, BillController.PayInVNPay)
router.post("/pay-in/momo", verifyToken, BillController.PayInMomo)
router.post("/purchase-course", verifyToken, BillController.PurchaseCourse)
router.post("/upgrade-account", verifyToken, BillController.UpgradeAccount)


module.exports = router;
