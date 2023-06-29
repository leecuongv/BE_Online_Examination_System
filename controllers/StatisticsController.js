// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const SubmitAssignment = require("../models/SubmitAssignment")
const { STATUS, VIEWPOINT, ROLES, FEE } = require("../utils/enum");
const moment = require("moment/moment");
const Bill = require('../models/Bill');
const Assignment = require("../models/Assignment");
const Lesson = require("../models/Lesson")
const StatisticController = {

    GetTakeExamByStudent: async (req, res) => {
        try {

            const username = req.user?.sub
            const { examSlug } = req.query

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản!" })

            const exam = await Exam.findOne({ slug: examSlug })
            if (!exam) return res.status(200).json({ message: "Không tìm thấy bài thi!" })
            let takeExams = await TakeExam.find({ examId: exam.id, userId: user.id }).populate('userId')
            takeExams = takeExams.map(item => {
                let { name, examId, __v, result, points, userId, ...data } = item._doc


                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                if (exam.viewAnswer === 'no' || (exam.viewAnswer === 'alldone' && moment().diff(exam.endTime, 'minutes') > 0)) {
                    points = 0
                }
                return {
                    ...data,

                    //name: userId?.fullname,   
                    //maxPoints: exam.maxPoints,
                    points
                }
            })


            return res.status(200).json({
                examName: exam.name,
                examId: exam.id,
                maxPoints: exam.maxPoints,
                typeofPoint: exam.typeofPoint,
                viewPoint: exam.viewPoint,
                viewAnswer: exam.viewAnswer,
                takeExams
            })
        }
        catch (err) {
            return res.status(500).json({ message: 'Lỗi thống kê' })
        }
    },

    GetTakeExamByTeacher: async (req, res) => {
        try {

            const username = req.user?.sub
            const { examSlug } = req.query

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            const exam = await Exam.findOne({ slug: examSlug })
            if (!exam) return res.status(200).json({ message: "Không tìm thấy bài thi!" })

            if (exam.creatorId.toString() !== user.id.toString()) {//nếu không phải người tạo khoá học thì không trả về kết quả
                return res.status(403).json({ message: "Không có quyền truy cập" })
            }
            let takeExams = await TakeExam.find({ examId: exam.id }).populate('userId')
            takeExams = takeExams.map(item => {
                let { examId, __v, result, points, userId, ...data } = item._doc

                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                return {
                    ...data,
                    name: userId?.fullname,
                    userAvatar: userId.avatar,
                    maxPoints: exam.maxPoints,

                    points
                }
            })


            return res.status(200).json({
                examName: exam.name,
                examId: exam.id,
                maxPoints: exam.maxPoints,
                typeofPoint: exam.typeofPoint,
                takeExams
            })

        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },

    GetTakeExamDetailByTeacher: async (req, res) => {
        try {

            const username = req.user?.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            let takeExams = await TakeExam.find()
                .populate('userId')
                .populate({
                    path: "examId",
                    match: { creatorId: user.id }
                })
            takeExams = takeExams.map(item => {
                let { examId, result, points, userId, ...data } = item._doc
                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                return {
                    ...data,
                    examName: examId.name,
                    name: userId?.fullname,
                    maxPoints: examId.maxPoints,
                    typeofPoint: examId.typeofPoint,
                    points
                }
            })

            return res.status(200).json(takeExams)
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },

    GetTakeExamDetail: async (req, res) => {
        try {

            const username = req.user?.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            let takeExams = await TakeExam.find()
                .populate('userId')
                .populate({
                    path: "examId",

                })
            takeExams = takeExams.map(item => {
                let { examId, result, points, userId, ...data } = item._doc
                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                return {
                    ...data,
                    examName: examId.name,
                    name: userId?.fullname,
                    maxPoints: examId.maxPoints,
                    typeofPoint: examId.typeofPoint,
                    points
                }
            })

            return res.status(200).json(takeExams)
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },

    GetSubmitAssignmentDetailByTeacher: async (req, res) => {
        try {

            const username = req.user?.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })



            let submitAssignment = await SubmitAssignment.find()
                .populate('creatorId')
                .populate({
                    path: "assignmentId",
                    match: { creatorId: user.id }
                })

            submitAssignment = submitAssignment.map(item => {

                let { assignmentId, result, points, creatorId, ...data } = item._doc

                return {
                    ...data,
                    assignmentName: assignmentId.name,
                    name: creatorId?.fullname,
                    maxPoints: assignmentId.maxPoints,
                    points
                }
            })
            return res.status(200).json(submitAssignment)
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },

    GetNumberOfCourses: async (req, res) => {
        try {
            const numberOfCourses = await Course.countDocuments()
            if (!numberOfCourses)
                return res.status(400).json({
                    message: "Không đếm được số lượng khóa học!"
                })
            return res.status(200).json({
                numberOfCourses
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng khóa học!" })

        }
    },

    GetNumberOfExams: async (req, res) => {
        try {
            const numberOfExam = await Exam.countDocuments()
            if (!numberOfExam)
                return res.status(400).json({
                    message: "Không đếm được số lượng bài kiểm tra!"
                })
            return res.status(200).json({
                numberOfExam
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng bài kiểm tra!" })

        }
    },

    GetNumberOfAssignments: async (req, res) => {
        try {
            const numberOfAssignment = await Assignment.countDocuments()
            if (!numberOfAssignment)
                return res.status(400).json({
                    message: "Không đếm được số lượng bài kiểm tra!"
                })
            return res.status(200).json({
                numberOfAssignment
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng bài kiểm tra!" })

        }
    },
    GetNumberOfLessons: async (req, res) => {
        try {
            const numberOfLesson = await Lesson.countDocuments()
            if (!numberOfLesson)
                return res.status(400).json({
                    message: "Không đếm được số lượng bài kiểm tra!"
                })
            return res.status(200).json({
                numberOfLesson
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng bài kiểm tra!" })

        }
    },

    GetNumberOfUsers: async (req, res) => {
        try {
            const numberOfUsers = await User.countDocuments()
            if (!numberOfUsers)
                return res.status(400).json({
                    message: "Không đếm được số lượng người dùng!"
                })
            return res.status(200).json({
                numberOfUsers
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng người dùng!" })
        }
    },

    GetDetailOfUsers: async (req, res) => {
        try {
            const numberOfUsers = await User.countDocuments()
            const numberOfTeachers = await User.countDocuments({
                role: ROLES.TEACHER
            })
            const numberOfStudents = await User.countDocuments({
                role: ROLES.STUDENT
            })
            const numberOfVipUsers = await User.countDocuments({
                premium: true
            })
            return res.status(200).json({
                numberOfUsers: numberOfUsers,
                numberOfTeachers: numberOfTeachers,
                numberOfStudents: numberOfStudents,
                numberOfVipUsers: numberOfVipUsers
            })
        }
        catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng người dùng!" })
        }
    },

    GetTotalNewUsersByDay: async (req, res) => {
        try {
            let listUsers = await User.aggregate([
                {
                    $addFields: {
                        createdAtDate: {
                            $toDate: "$createdAt"
                        },

                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAtDate"
                            }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $project: {
                        count: 1,
                        date: "$_id",
                        _id: 0
                    }
                }
            ])
            return res.status(200).json(listUsers)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })

        }
    },

    GetListBills: async (req, res) => {
        try {
            let listPayments = await Bill.find().populate('creatorId')
            listPayments = listPayments.map(item => {
                if (item.description.includes("Mua")) {
                    let amount = item.amount * FEE.FEE / 100
                    item.amount = amount
                }
                return {
                    name: item.creatorId.fullname,
                    amount: item.amount,
                    description: item.description,
                    status: item.status,
                    method: item.method,
                    createdAt: item.createdAt
                }
            })
            return res.status(200).json(listPayments)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }
    },

    GetListBillByUser: async (req, res) => {
        try {
            const username = req.user?.sub
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Không xác định tài khoản" })
            }
            let listPayments = await Bill.find({ userId: user.id })

            listPayments = listPayments.map(item => {
                return {
                    id: item.id,
                    name: item.creatorId.fullname,
                    amount: item.amount,
                    description: item.description,
                    status: item.status,
                    method: item.method,
                    updatedAt: item.updatedAt
                }
            })
            return res.status(200).json(listPayments)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }
    },

    GetTotalRevenue: async (req, res) => {
        try {
            let updateAccountAmount = 0
            let purchaseCourseAmount = 0
            let listPayments = await Bill.find({ status: STATUS.SUCCESS })
            var tempTotalRevenue = 0
            let listpc = []
            listPayments.forEach((item, index) => {
                if (item.description.includes("Mua")) {
                    purchaseCourseAmount += item.amount * FEE.FEE / 100
                    listpc.push(item.id)
                }
                if (item.description.includes("Nâng")) {
                    updateAccountAmount += item.amount
                }

            })
            return res.status(200).json({ totalRevenue: updateAccountAmount + purchaseCourseAmount, updateAccountAmount, purchaseCourseAmount })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }


    },

    GetTotalRevenueByDay: async (req, res) => {
        try {
            // let listPayments = await Bill.find()
            // listPayments = listPayments.map(item => {
            //     return {
            //         item,
            //         dateAdd: format(item.createdAt, 'yyyy-MM-dd')
            //     }
            // })
            // var result = [];
            // listPayments.reduce(function (res, value) {
            //     if (!res[value.dateAdd]) {
            //         res[value.dateAdd] = { dateAdd: value.dateAdd, amount: 0 };
            //         result.push(res[value.dateAdd])
            //     }
            //     res[value.dateAdd].amount += value.item.amount;
            //     return res;
            // }, {});
            let listBillUpgradeAccount = await Bill.aggregate([
                {
                    $match: {
                        status: "success",
                        "description": {
                            "$regex": "Nâng"
                        }
                    },
                },
                {
                    $addFields: {
                        createdAtDate: {
                            $toDate: "$createdAt"
                        },

                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAtDate"
                            }
                        },
                        revenue: {
                            $sum: "$amount"
                        }
                    }
                },

                {
                    $project: {
                        revenue: 1,

                        date: "$_id",
                        _id: 0,

                    }
                }
            ])

            let listBillUPurchaseCourse = await Bill.aggregate([
                {
                    $match: {
                        status: "success",
                        "description": {
                            "$regex": "Mua"
                        }
                    },
                },
                {
                    $addFields: {
                        createdAtDate: {
                            $toDate: "$createdAt"
                        },

                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAtDate"
                            }
                        },
                        revenue: {
                            $sum: { "$multiply": ["$amount", FEE.FEE / 100] }
                        }
                    }
                },

                {
                    $project: {
                        revenue: 1,

                        date: "$_id",
                        _id: 0,

                    }
                }
            ])

            const combinedArrays = listBillUpgradeAccount.concat(listBillUPurchaseCourse);

            // Sort the combined array by date
            combinedArrays.sort((a, b) => a.date - b.date);

            return res.status(200).json(combinedArrays)
            //return res.status(200).json(result)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }
    },

    GetDetailOfCourse: async (req, res) => {
        try {
            const courseId = req.query.courseId

            const username = req.user?.sub
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const course = await Course.findOne({ courseId: courseId })

            if (!course)
                return res.status(400).json({ message: "Không tồn tại khóa học!" })

            const listExam = await Course.aggregate([
                {
                    $match: { courseId: Number(courseId) }
                },
                {
                    $lookup:
                    {
                        from: "lessons",
                        localField: "lessons",
                        foreignField: "_id",
                        as: "lessons"
                    }
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
                        _id: '$exams._id', "doc": { "$first": "$$ROOT.exams" },
                        countTakeExam: {
                            $sum: {
                                $cond: [{ $ifNull: ['$takeExams', false] }, 1, 0]
                            }
                        }
                    }
                },
                { $match: { _id: { $ne: null } } },
                {
                    $project: {
                        id: "$doc._id",
                        name: "$doc.name",
                        countTakeExam: "$countTakeExam",
                    }
                }
            ]
            )
            var countTakeExams = 0
            listExam.forEach((item) => {
                countTakeExams += item.countTakeExam
            })

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
                        _id: '$assignments._id', "doc": { "$first": "$$ROOT.assignments" },
                        countSubmitAssignment: {
                            $sum: {
                                $cond: [{ $ifNull: ['$submitAssignments', false] }, 1, 0]
                            }
                        }
                    }
                },
                { $match: { _id: { $ne: null } } },
                {
                    $project: {
                        id: "$doc._id",
                        name: "$doc.name",
                        countSubmitAssignment: "$countSubmitAssignment",
                    }
                }
            ]
            )

            var countSubmitAssignments = 0
            listAssignment.forEach((item) => {
                countSubmitAssignments += item.countSubmitAssignment
            })

            let countExams = course.exams.length
            let countAssignments = course.assignments.length
            let countStudents = course.students.length
            let countLessons = course.lessons.length


            return res.status(200).json({ countStudents, countLessons, countExams, countAssignments, countTakeExams, countSubmitAssignments })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }
    },
    GetDetailOfStudent: async (req, res) => {
        try {
            const username = req.user?.sub
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const numberOfCoursesJoined = await Course.countDocuments({
                students: { $in: [mongoose.Types.ObjectId(user.id)] }
            })
            const numberOfExamsTaken = await TakeExam.countDocuments({ userId: user.id })
            const numberOfAssignmentsSubmitted = await SubmitAssignment.countDocuments({ userId: user.id })

            return res.status(201).json({
                numberOfCoursesJoined,
                numberOfExamsTaken,
                numberOfAssignmentsSubmitted
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng người dùng!" })
        }
    },
    GetDetailOfTeacher: async (req, res) => {
        try {
            const username = req.user?.sub
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const numberOfCoursesCreated = await Course.countDocuments({ creatorId: user.id })
            const numberOfExamCreated = await Exam.countDocuments({ creatorId: user.id })
            const numberOfAssignmentsCreated = await SubmitAssignment.countDocuments({ creatorId: user.id })

            return res.status(201).json({
                numberOfCoursesCreated,
                numberOfExamCreated,
                numberOfAssignmentsCreated
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng người dùng!" })
        }
    },

}

module.exports = { StatisticController }
