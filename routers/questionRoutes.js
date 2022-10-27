const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { QuestionController } = require('../controllers/QuestionControler')
const router = express.Router();

router.post('/create-question', verifyToken, QuestionController.CreateQuestion);


module.exports = router;