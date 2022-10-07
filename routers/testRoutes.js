const express = require("express");
const router = express.Router();
const verifyToken = require("../controllers/middlewareController");
const dotenv = require("dotenv");
const Exam = require("../models/Exam");
const { ROLES, STATUS, COLLECTION } = require("../utils/enum");
const { formatTimeUTC_, formatTimeUTC } = require("../utils/Timezone");
const TextUtils = require("../utils/TextUtils");
dotenv.config({ path: "./.env" });

router.get("/creator/:creatorId", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        const exams = await Exam.find({ creatorId: req.params.creatorId });
        if (exams) {
            res.json({
                success: true,
                message: "Get all exam successfully ",
                exams,
            });
        } else {
            res.json({
                success: false,
                message: "Exams do not exist",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        const exams = await Exam.find();
        if (exams) {
            res.json({
                success: true,
                message: "Get all exam successfully ",
                exams,
            });
        } else {
            res.json({
                success: false,
                message: "Exams do not exist",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/:testId", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR ||
                req.body.verifyAccount.role === ROLES.USER)
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        let exam = null
        if (req.body.verifyAccount.role === ROLES.USER) {
            exam = await Exam.findById(req.params.testId)
                .populate({
                    path: 'questions',
                    select: "-__v -createdAt -updatedAt -correctAnswers",
                    populate: {
                        path: 'answers',
                        select: "-__v -createdAt -updatedAt"
                    }
                })
                .exec();
        }
        else {
            exam = await Exam.findById(req.params.testId)
                .populate({
                    path: 'questions',
                    select: "-__v -createdAt -updatedAt",
                    populate: {
                        path: 'answers',
                        select: "-__v -createdAt -updatedAt"
                    }
                })
                .exec();
        }

        if (exam) {
            res.json({
                success: true,
                message: "Get exam by id successfully ",
                data: exam,
            });
        } else {
            res.json({
                success: false,
                message: "Exam does not exist",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.post("", verifyToken, async (req, res) => {
    try {
        //Check permission

        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        if (!req.body)
            res.status(400).json({
                success: false,
                message: "Body request not found",
            });

        //Create new question
        let exam = new Exam({
            name: req.body.name,
            creatorId: req.body.creatorId,
            description: req.body.description,
            pin: req.body.pin,
            questions: req.body.questions, // can null
            questionsOrder: req.body.questionsOrder,
            startTime: new Date(req.body.startTime), // formatTimeUTC_(req.body.startTime),
            endTime: new Date(req.body.endTime), // formatTimeUTC_(req.body.endTime),
            url: TextUtils.makeSlug(COLLECTION.CONTEST, req.body.name),
            maxPoints: req.body.maxPoints,
            maxTimes: req.body.maxTimes,
            _status: req.body._status,
            questionsOrder: req.body.questionsOrder,
            tracking: req.body.tracking,
        });

        //Send to Database
        exam = await exam.save();

        res.json({
            success: true,
            message: "Exam created successfully",
            exam: exam,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.put("/:testId/questions", verifyToken, async (req, res) => {
    try {
        //Check permission

        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        if (!req.body)
            res.status(400).json({
                success: false,
                message: "Body request not found",
            });

        //update new question
        let exam = await Exam.findByIdAndUpdate(req.params.testId,
            {
                questions: req.body.questions,
                questionsOrder: req.body.questionsOrder,
                updatedAt: new Date()// formatTimeUTC(),
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Exam updated successfully",
            exam: exam,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.put("/:testId", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        if (!req.body)
            res.status(400).json({
                success: false,
                message: "Body request not found",
            });
        let exam;
        exam = {
            name: req.body.name,
            creatorId: req.body.creatorId,
            description: req.body.description,
            questions: req.body.questions,
            pin: req.body.pin,
            startTime: new Date(req.body.startTime), // formatTimeUTC_(req.body.startTime),
            endTime: new Date(req.body.endTime), //formatTimeUTC_(req.body.endTime),
            url: TextUtils.makeSlug(COLLECTION.CONTEST, req.body.name),
            maxPoints: req.body.maxPoints,
            maxTimes: req.body.maxTimes,
            _status: req.body._status,
            questionsOrder: req.body.questionsOrder,
            tracking: req.body.tracking,
            updatedAt: new Date(), //formatTimeUTC(),
        };

        const updatedExam = await Exam.findOneAndUpdate(
            { _id: req.params.testId },
            exam,
            { new: true }
        ).populate("questions")
            .populate({
                path: "questions",
                populate: {
                    path: "answers"
                }
            })
            .exec();

        res.json({
            success: true,
            message: "Update exam successfully",
            exam: updatedExam,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.put("/:testId/delete", verifyToken, async (req, res) => {
    try {
        //Check permission
        if (
            !(
                req.body.verifyAccount.role === ROLES.ADMIN ||
                req.body.verifyAccount.role === ROLES.CREATOR
            )
        ) {
            return res
                .status(401)
                .json({ success: false, message: "Permission denied" });
        }

        if (!req.body)
            res.status(400).json({
                success: false,
                message: "Body request not found",
            });

        const deletedExam = await Exam.findOneAndUpdate(
            req.params.testId,
            {
                _status: STATUS.DELETED,
                updatedAt: new Date(), // formatTimeUTC_(new Date())
            },
            { new: true }
        );
        res.json({
            success: true,
            message: "Delete exam successfully",
            exam: deletedExam,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
