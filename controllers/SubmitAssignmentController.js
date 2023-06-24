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
            const username = req.user?.sub;
            const { assignmentId, content, file } = req.body;
            const toDay = new Date()
            if (!username)
                return res.status(400).json({ message: "Không có người dùng!" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng!" });
            const assignment = await Assignment.findById(assignmentId)
            if (!assignment)
                return res.status(400).json({ message: "Không tồn tại bài tập!" })

            if (assignment.allowSubmitLate === false)
                if ((toDay < (new Date(assignment.startTime)) || (toDay > (new Date(assignment.endTime))))) {
                    return res.status(400).json({ message: "Không nằm trong thời gian nộp bài!" })
                }
            const newSubmitAssignment = new SubmitAssignment({
                assignmentId: assignmentId,
                creatorId: user.id,
                content,
                submitTime: new Date(),
                file,
                point: null
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
            res.status(400).json({ message: "Lỗi nộp bài tập!" })
        }
    },
    Update: async (req, res) => {
        try {
            const username = req.user?.sub;
            const { submitAssignmentId, content, file } = req.body;
            const toDay = new Date()
            if (!username)
                return res.status(400).json({ message: "Không có người dùng!" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng!" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)



            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })

            const assignment = await Assignment.findById(submitAssignment.assignmentId)

            if (assignment.allowSubmitLate === false)
                if ((toDay < (new Date(assignment.startTime)) || (toDay > (new Date(assignment.endTime))))) {
                    return res.status(200).json({ message: "Đã hết thời gian chỉnh sửa bài tập!" })
                }

            if (submitAssignment.points > 0) {
                return res.status(200).json({ message: "Bài tập đã được chấm điểm, không thể chỉnh sửa!" })
            }
            if (assignment.status !== STATUS.PUBLIC)
                return res.status(200).json({ message: "Bài tập đã đóng hoặc chưa mở!" })
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
            const username = req.user?.sub;
            const submitAssignmentId = req.query.id;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng!" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng!" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })
            const assignment = await Assignment.findById(submitAssignment.assignmentId)
            if (submitAssignment.points > 0) {
                return res.status(400).json({ message: "Bài tập đã được chấm điểm, không thể chỉnh sửa!" })
            }
            if (assignment.allowSubmitLate === false)
                if ((toDay < (new Date(assignment.startTime)) || (toDay > (new Date(assignment.endTime))))) {
                    return res.status(200).json({ message: "Đã hết thời gian chỉnh sửa bài tập!" })
                }
            await SubmitAssignment.deleteOne({ "_id": mongoose.Types.ObjectId(submitAssignmentId) })

            return res.status(200).json({
                message: "Xóa bài tập đã nộp thành công!"
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xoá bài tập!" })
        }
    },
    Mark: async (req, res) => {
        try {
            const username = req.user?.sub;
            const { submitAssignmentId, points } = req.body;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng!" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng!" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })
            if (points < 0)
                return res.status(400).json({ message: "Điểm phải lớn hơn hoặc bằng 0!" })
            const assignment = await Assignment.findById(submitAssignment.assignmentId)
            let isPass = false

            if ((points / assignment.maxPoints) >= (assignment.toPass / 100)) {
                isPass = true
            }
            const updateSubmitAssignment = await SubmitAssignment.findByIdAndUpdate(
                { "_id": new mongoose.Types.ObjectId(submitAssignmentId) },
                { points: points, isPass: isPass },
                { new: true })

            return res.status(200).json({
                updateSubmitAssignment
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi chấm điểm bài tập!" })
        }
    },
    GetSubmitAssignmentById: async (req, res) => {
        try {
            const username = req.user?.sub;
            const submitAssignmentId = req.query.id;
            if (!username)
                return res.status(400).json({ message: "Không có người dùng!" });
            const user = await User.findOne({ username });
            if (!user)
                return res.status(400).json({ message: "Không có người dùng!" });
            const submitAssignment = await SubmitAssignment.findById(submitAssignmentId)

            if (!submitAssignment)
                return res.status(400).json({ message: "Không tồn tại thông tin nộp bài tập!" })

            return res.status(200).json({
                submitAssignment: submitAssignment._doc
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi chấm điểm bài tập!" })
        }
    },

    GetSubmitAssignmentByAssignmentSlug: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const slug = req.query.slug
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }

            const assignment = await Assignment.findOne({ slug: slug })
            const course = await Course.findById(assignment.courseId).populate('students')

            let submitAssignment = await SubmitAssignment.find({ assignmentId: assignment.id })


            let results = course.students.map(student => {
                let { _id: studentId, fullname, avatar } = student._doc
                let submitAssignmentOfStudent = submitAssignment.find(item => item.creatorId.toString() === studentId.toString())

                return {
                    id: submitAssignmentOfStudent?.id,
                    fullname,
                    avatar,
                    maxPoints: assignment.maxPoints,
                    submitTime: submitAssignmentOfStudent?.submitTime,
                    points: submitAssignmentOfStudent?.points,
                    endTime: assignment.endTime
                }
            })

            console.log(results)

            if (assignment) {
                return res.status(200).json(results)
            }
            return res.status(400).json({
                message: "Không tìm thấy bài tập!",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài tập!" })
        }
    },
}





module.exports = { SubmitAssignmentController };