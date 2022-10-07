const express = require("express");
const router = express.Router();
const verifyToken = require("../controllers/middlewareController");
const dotenv = require("dotenv");
const { ROLES, STATUS } = require("../utils/enum");
dotenv.config({ path: "./.env" });
const Bill = require("../models/Bill")

router.get("", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        const bills = await Bill.find().populate("user");
        if (bills) {
            res.json({
                success: true,
                message: "Get all bills successfully ",
                bills: bills,
            });
        } else {
            res.json({
                success: false,
                message: "Bills do not exist",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
router.post("", verifyToken, async (req, res) => {
    try {
        if (!req.body)
            res.status(400).json({
                success: false,
                message: "Body request not found",
            });

        let bill = new Bill({
            user: req.body.userId,
            amount: req.body.amount,
            _status: req.body._status
        });

        bill = await bill.save();


        res.json({
            success: true,
            message: "Bill created successfully",
            bill: bill,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
