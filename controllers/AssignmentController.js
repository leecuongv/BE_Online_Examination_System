const Assignment = require("../models/Assignment")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const { STATUS } = require("../utils/enum");
const { CompareDate, IsClose, IsOpen } = require("./handler/DateTimeHandler")

const SubmitAssignment = require("../models/SubmitAssignment")

const AssignmentController = {
    CreateAssignment: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId, name, content, startTime, endTime, maxPoints, allowReSubmit, allowSubmitLate, status, file } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học!" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date" || CompareDate(startTime, endTime) >= 0) {
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ!" })
            }

            if (CompareDate(startTime, course.startTime) === -1 || CompareDate(endTime, course.endTime) === 1) {
                return res.status(400).json({ message: "Thời gian của bài tập phải nằm trong thời gian khoá học diễn ra!" })

            }

            const newAssignment = await new Assignment({
                courseId,
                name,
                content,
                maxPoints,
                allowReSubmit,
                allowSubmitLate,
                creatorId: user.id,
                file,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime)

            })
            let error = newAssignment.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo bài tập thất bại!"
                })
            }
            const assignment = await newAssignment.save();

            course.assignments.push(assignment.id);
            await course.save()

            return res.status(200).json({
                message: "Tạo bài tập mới thành công!",
                slug: assignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài tập!" })
        }
    },

    getAssignmentBySlug: async (req, res) => {
        try {
            const username = req.user?.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            const { slug } = req.query
            const assignment = await Assignment.findOne({ slug, creatorId: user.id })
            if (assignment) {
                return res.status(200).json(assignment._doc)
            }

            return res.status(400).json({
                message: "Không tìm thấy bài tập!",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi hiển thị bài tập!" })
        }
    },

    UpdateAssignment: async (req, res) => {
        try {
            const username = req.user?.sub
            const { assignmentId, courseId, name, content, startTime, endTime, maxPoints, allowReSubmit, allowSubmitLate, status, file } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng!" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ!" })

            const existAssignment = await Assignment.findById(assignmentId)
            if (!existAssignment) return res.status(400).json({ message: "Không có bài tập!" })


            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ!" })

            }
            if (CompareDate(startTime, course.startTime) === -1 || CompareDate(endTime, course.endTime) === 1) {
                return res.status(400).json({ message: "Thời gian của bài tập phải nằm trong thời gian khoá học diễn ra!" })

            }

            let newData = {
                courseId,
                name,
                content,
                maxPoints,
                allowReSubmit,
                allowSubmitLate,
                file,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime)

            }

            let updatedAssignment = await Assignment.findByIdAndUpdate(assignmentId, newData, { new: true })

            await course.save()

            return res.status(200).json({
                updatedAssignment
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài tập!" })
        }
    },

    PublicAssignment: async (req, res) => {
        try {
            const username = req.user?.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập!" })



            exitsAssignment = await Assignment.findByIdAndUpdate(id, {
                status: STATUS.PUBLIC
            }, { new: true })
            return res.status(200).json({
                message: "Xuất bản bài tập thành công!",

                slug: exitsAssignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài tập!" })
        }
    },
    CloseAssignment: async (req, res) => {
        try {
            const username = req.user?.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập!" })



            exitsAssignment = await Assignment.findByIdAndUpdate(id, {
                status: STATUS.CLOSE
            }, { new: true })
            return res.status(200).json({
                message: "Đóng bài tập thành công!",

                slug: exitsAssignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đóng bài tập!" })
        }
    },

    DeleteAssignment: async (req, res) => {
        try {
            const username = req.user?.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập!" })

            let course = await Course.findById(exitsAssignment.courseId)
            course.assignments = course.assignments.filter(item => item.toString() !== id)
            await course.save()


            exitsAssignment = await Assignment.deleteOne({ "_id": mongoose.Types.ObjectId(id) })

            await SubmitAssignment.deleteMany({ assignmentId: id })

            return res.status(200).json({
                message: "Xóa bài tập thành công!",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài tập" })
        }
    },
    getAssignmentByCourseOfTeacher: async (req, res) => {
        try {
            const username = req.user?.sub
            const courseId = req.query.courseId
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }
            const course = await Course.findOne({ courseId, creatorId: user.id })
                .populate({
                    path: 'assignments'
                })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ!" })



            if (course) {
                // const result = listExam.map(item => {
                return res.status(200).json(course._doc.assignments)
            }
            return res.status(400).json({
                message: "Không tìm thấy bài tập!",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài tập!" })
        }
    },
    getAssignmentByCourseOfStudent: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const course = await Course.findOne({ courseId })
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }
            let listAssignment = await Assignment.aggregate([
                {
                    $match: {
                        courseId: course._id,
                        status: STATUS.PUBLIC

                    }
                },
                {
                    $lookup:
                    {
                        from: "submit_assignments",
                        localField: "_id",
                        foreignField: "assignmentId",
                        as: "submit"
                    }
                },
            ])



            listAssignment = listAssignment.map(item => {

                let tmp = item.submit.find(element => element.creatorId.toString() === user.id.toString())

                delete item.submit
                if (tmp)
                    return { ...item, isSubmit: true }
                return { ...item, isSubmit: false }
            })



            return res.status(200).json(listAssignment)


        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài tập!" })
        }
    },
    getAssignmentBySlugOfStudent: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const slug = req.query.slug
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }

            const assignment = await Assignment.findOne({ slug: slug })


            const submitAssignment = await SubmitAssignment.findOne({ assignmentId: assignment.id, creatorId: user.id })


            if (assignment) {
                return res.status(200).json({
                    assignment: assignment,
                    submitAssignment: submitAssignment
                })
            }
            return res.status(400).json({
                message: "Không tìm thấy bài tập!",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài tập!" })
        }
    },

};


module.exports = { AssignmentController }
