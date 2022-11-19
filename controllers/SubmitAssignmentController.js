const Assignment = require("../models/Assignment");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const SubmitAssignment = require("../models/SubmitAssignment");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const SubmitAssignmentController = {
    Create: async (req, res) => {
        try {
            const username = req.user.sub;
            const { assignmentId, content, file } = req.body;
            const toDay = new Date()
            if (!username)
                return res.status(400).json({ message: "Không có người dùng" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng" });
            const assignment = await Assignment.findById(assignmentId)
            if (!assignment)
                return res.status(400).json({ message: "Không tồn tại bài tập!" })

            if ((toDay < (new Date(assignment.startTime)) || (toDay > (new Date(assignment.endTime)))))
                return res.status(200).json({ message: "Không nằm trong thời gian nộp bài!" })

            const newSubmitAssignment = new SubmitAssignment({
                assignmentId,
                userId: user.id,
                content,
                submitTime: new Date(),
                file,
                point
            })
            let error = newSubmitAssignment.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Nộp bài tập thất bại!"
                })
            }
            const submitAssignment = await newSubmitAssignment.save()
            return res.status(200).json({
                submitAssignment
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi nộp bài tập" })
        }
    },
    Update: async (req, res) => {
        try {
            const username = req.user.sub;
            const { submitAssignmentId, content, file } = req.body;
            const toDay = new Date()
            if (!username)
                return res.status(400).json({ message: "Không có người dùng" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)



            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })

            const assignment = await Assignment.findById(submitAssignment.assignmentId)

            if ((toDay < (new Date(assignment.startTime)) || (toDay > (new Date(assignment.endTime)))))
                return res.status(200).json({ message: "Không nằm trong thời gian nộp bài!" })

            if (assignment.status !== STATUS.PUBLIC)
                return res.status(200).json({ message: "Bài tập đã đóng hoặc chưa mở" })
            const data = {
                content,
                submitTime: new Date(),
                file,
            }

            const updateSubmitAssignment = await SubmitAssignment.findByIdAndUpdate({ "_id": new mongoose.Types.ObjectId(submitAssignmentId) }, data, { new: true })

            return res.status(200).json({
                updateSubmitAssignment
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi nộp bài tập" })
        }
    },
    Delete: async (req, res) => {
        try {
            const username = req.user.sub;
            const submitAssignmentId = req.query.id;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })

            const updateSubmitAssignment = await SubmitAssignment.deleteOne(submitAssignmentId)

            return res.status(200).json({
                message: "Xóa lịch sử nộp bài tập thành công"
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi nộp bài tập" })
        }
    },
    Marking: async (req, res) => {
        try {
            const username = req.user.sub;
            const { submitAssignmentId, point } = req.body;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })
            const updateSubmitAssignment = await SubmitAssignment.findByIdAndUpdate(
                { "_id": new mongoose.Types.ObjectId(submitAssignmentId) },
                { point: point },
                { new: true })

            return res.status(200).json({
                updateSubmitAssignment
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi chấm điểm bài tập" })
        }
    },
    GetSubmitAssignmentById: async (req, res) => {
        try {
            const username = req.user.sub;
            const submitAssignmentId = req.query.id;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })

            return res.status(200).json({
                submitAssignment: submitAssignment._doc
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi chấm điểm bài tập" })
        }
    },

};




module.exports = { SubmitAssignmentController };