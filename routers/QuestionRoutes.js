const express = require('express')
const { verifyToken, verifyTokenAdmin } = require("../controllers/middlewareController")
const { QuestionController } = require('../controllers/QuestionController')
const router = express.Router();

router.post('/create-question', verifyToken, QuestionController.CreateQuestion);
router.delete('', verifyToken, QuestionController.DeleteQuestion);


module.exports = router;
