const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { TickController } = require('../controllers/TickController')
const router = express.Router();

router.post('/create', verifyToken, TickController.Create);

router.put('/update', verifyToken, TickController.Update);
router.delete('/', verifyToken, TickController.Delete);
router.get("/", verifyToken, TickController.getByID);
router.get("/by-tick-id", verifyToken, TickController.getByTickID);

module.exports = router;
