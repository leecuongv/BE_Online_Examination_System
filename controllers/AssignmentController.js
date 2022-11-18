const Assignment = require("../models/Assignment")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const QuestionBank = require("../models/QuestionBank");
const { STATUS } = require("../utils/enum");

const AssignmentController = {
    CreateAssignment: async (req, res) => {
        try {
            const username = req.user.sub
            const { courseId, name, content, startTime, endTime, maxPoints, allowReSubmit, allowSubmitLate, status } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học" })



            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ" })

            }

            if ((new Date(startTime)) < (new Date(course.startTime)) || (new Date(endTime)) > (new Date(course.endTime)))
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ" })

            const newAssignment = await new Assignment({
                courseId,
                name,
                content,
                maxPoints,
                allowReSubmit,
                allowSubmitLate,
                creatorId: user.id,
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
                message: "Tạo bài thi mới thành công",
                slug: assignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },

    getAssignmentBySlug: async (req, res) => {
        try {
            const username = req.user.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const { slug } = req.query
            console.log(slug)
            const assignment = await Assignment.findOne({ slug, creatorId: user.id })
            if (assignment) {
                return res.status(200).json(Assignment._doc)
            }

            return res.status(400).json({
                message: "Không tìm thấy bài tập",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi hiển thị bài tập" })
        }
    },

    UpdateAssignment: async (req, res) => {
        try {
            const username = req.user.sub
            const { assignmentId, courseId, name, content, startTime, endTime, maxPoints, allowReSubmit, allowSubmitLate, status } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ" })

            const existAssignment = await Assignment.findById(assignmentId)
            if (!existAssignment) return res.status(400).json({ message: "Không có bài tập" })


            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ" })

            }

            if ((new Date(startTime)) < (new Date(course.startTime)) || (new Date(endTime)) > (new Date(course.endTime)))
                return res.status(400).json({ message: "Thời gian của bài tập không hợp lệ" })

            let newData = {
                courseId,
                name,
                content,
                maxPoints,
                allowReSubmit,
                allowSubmitLate,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime)

            }

            let updatedAssignment = await Assignment.findByIdAndUpdate({ "_id": new mongoose.Types.ObjectId(assignmentId) }, newData, { new: true })

            await course.save()

            return res.status(200).json({
                updatedAssignment
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },

    PublicAssignment: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập" })


            console.log(exitsAssignment)

            let error = exitsAssignment.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Xuất bản bài tập thất bại!"
                })
            }
            const status = STATUS.PUBLIC
            exitsAssignment = await Assignment.findByIdAndUpdate(id, {
                status
            }, { new: true })
            return res.status(200).json({
                message: "Xuất bản bài thi thành công",

                slug: exitsAssignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài thi" })
        }
    },
    CloseAssignment: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập" })

            console.log(exitsAssignment)

            let error = exitsAssignment.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Đóng bài thi thất bại!"
                })
            }

            exitsAssignment = await Assignment.findByIdAndUpdate(id, {
                status: STATUS.CLOSE
            }, { new: true })
            return res.status(200).json({
                message: "Đóng bài thi thành công",

                slug: exitsAssignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đóng bài thi" })
        }
    },

    DeleteAssignment: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsAssignment = await Assignment.findById(id)
            if (!exitsAssignment) return res.status(400).json({ message: "Không có bài tập" })


            console.log(exitsAssignment)

            let error = exitsAssignment.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Xóa bài tập thất bại!"
                })
            }
            exitsAssignment = await Assignment.deleteOne(id)
            return res.status(200).json({
                message: "Xóa bài tập thành công",

                slug: exitsAssignment._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài thi" })
        }
    },
    getListAssignmentOfCourse: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            console.log(courseId)

            const listAssignment = await Course.aggregate([
                {
                    $match: { courseId: Number(courseId) }
                },
                {
                    $lookup:
                    {
                        from: "assignments",
                        localField: "assignments",
                        foreignField: "_id",
                        as: "assignments"
                    }
                },
                {
                    $unwind: {
                        path: "$assignments",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "submit_assignments",
                        localField: "assignments._id",
                        foreignField: "assignmentId",
                        as: "submitAssignments"
                    }
                },
                {
                    $unwind: {
                        path: "$submitAssignments",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$assignments._id', "doc": { "$first": "$$ROOT.assignment" }
                        , count: {
                            $sum: {
                                $cond: [{ $ifNull: ['$submitAssignments', false] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        id: "$doc._id",
                        name: "$doc.name",
                        count: "$count",
                        slug: "$doc.slug",
                        status: '$doc.status',
                        startTime: '$doc.startTime',
                        endTime: '$doc.endTime',
                    }
                }
            ]
            )
            console.log(listAssignment)

            if (listAssignment) {
                // const result = listExam.map(item => {
                return res.status(200).json(listAssignment)
            }
            return res.status(400).json({
                message: "Không tìm bài tập",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo bài tập" })
        }
    },
    getListExamInCourseOfStudent: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            console.log(courseId)

            const listExam = await Course.aggregate([
                {
                    $match: { courseId: Number(courseId) }
                },
                {
                    $lookup:
                    {
                        from: "exams",
                        localField: "exams",
                        foreignField: "_id",
                        as: "exams"
                    }
                },
                {
                    $unwind: {
                        path: "$exams",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "take_exams",
                        localField: "exams._id",
                        foreignField: "examId",
                        as: "takeExams"
                    }
                },
                {
                    $unwind: {
                        path: "$takeExams",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$exams._id', "doc": { "$first": "$$ROOT.exams" }
                        , count: {
                            $sum: {
                                $cond: [{ $ifNull: ['$takeExams', false] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        id: "$doc._id",
                        name: "$doc.name",
                        count: "$count",
                        slug: "$doc.slug",
                        status: '$doc.status',
                        numberofQuestions: "$doc.numberofQuestions",
                        startTime: '$doc.startTime',
                        endTime: '$doc.endTime',
                        maxTimes: '$doc.maxTimes'
                    }
                }
            ]
            )
            console.log(listExam)

            if (listExam) {
                listExam = listExam.filter(item=>item.status!==STATUS.PRIVATE)
                return res.status(200).json(listExam)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo khoá học" })
        }
    }

};


module.exports = { AssignmentController }
