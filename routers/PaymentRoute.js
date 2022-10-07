
import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import {verifyToken, verifyTokenAdmin} from "../controllers/middlewareController.js"

const router = express.Router();
router.post('/create-payment',PaymentController.createPayment);



router.post('/result-payment',PaymentController.ipn);
export default router