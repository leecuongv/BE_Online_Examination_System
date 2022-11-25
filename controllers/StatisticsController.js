// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const SubmitAssignment = require("../models/SubmitAssignment")
const { STATUS, VIEWPOINT, ROLES } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");
const Bill = require('../models/Bill')
const StatisticController = {

    GetTakeExamByStudent: async (req, res) => {
        try {

            const username = req.user.sub
            const { examSlug } = req.query

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            const exam = await Exam.findOne({ slug: examSlug })
            if (!exam) return res.status(200).json({ message: "Không tìm thấy bài thi!" })
            let takeExams = await TakeExam.find({ userId: user.id, examId: exam.id })
            takeExams = takeExams.map(item => {
                let { result, points, userId, ...data } = item._doc
                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                return {
                    ...data,
                    name: userId?.fullname,
                    maxPoints: exam.maxPoints,
                    points
                }
            })
            console.log("------------------------------------------------------------------------------")
            console.log(takeExams)

            /*let results = takeExams.map(item => ({
                ...item._doc,
                maxPoints: exam.maxPoints

            }))*/
            return res.status(200).json(takeExams)
        }
        catch (err) {
            return res.status(500).json({ message: 'Lỗi thống kê' })
        }
    },
    GetTakeExamByTeacher: async (req, res) => {
        try {

            const username = req.user.sub
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
                console.log(item)
                let { result, points, userId, ...data } = item._doc
                points = result.reduce((total, current) => {

                    total += current.point
                    return total
                },
                    0
                )
                return {
                    ...data,
                    name: userId?.fullname,
                    maxPoints: exam.maxPoints,
                    points
                }
            })
            console.log("------------------------------------------------------------------------------")
            console.log(takeExams)


            return res.status(200).json(takeExams)
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },
    GetTakeExamDetailByTeacher: async (req, res) => {
        try {

            const username = req.user.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            let takeExams = await TakeExam.find()
                .populate('userId')
                .populate({
                    path: "examId",
                    match: { creatorId: user.id }
                })
            takeExams = takeExams.map(item => {
                console.log(item)
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
                    points
                }
            })
            console.log("------------------------------------------------------------------------------")
            console.log(takeExams)


            return res.status(200).json(takeExams)
        }
        catch (err) {
            console.log(err)
            return res.status(400).json({ message: 'Lỗi thống kê' })
        }
    },
    GetSubmitAssignmentDetailByTeacher: async (req, res) => {
        try {

            const username = req.user.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            let submitAssignment = await SubmitAssignment.find()
                .populate('creatorId')
                .populate({
                    path: "assignmentId",
                    match: { creatorId: user.id }
                })

            console.log(submitAssignment)
            submitAssignment = submitAssignment.map(item => {
                //console.log(item)
                let { assignmentId, result, points, creatorId, ...data } = item._doc
                // points = result.reduce((total, current) => {

                //     total += current.point
                //     return total
                // },
                //     0
                // )
                return {
                    ...data,
                    assignmentName: assignmentId.name,
                    name: creatorId?.fullname,
                    maxPoints: assignmentId.maxPoints,
                    points
                }
            })
            console.log("------------------------------------------------------------------------------")
            //console.log(submitAssignment)


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
    getDetailOfUsers: async (req, res) => {
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
            // let listUsers = await User.find()
            // listUsers = listUsers.map(item => {
            //     if (item._doc.hasOwnProperty('createdAt')) {
            //         return {
            //             item,
            //             dateAdd: format(item.createdAt, 'yyyy-MM-dd')
            //         }
            //     }
            //     return {
            //         item,
            //         dateAdd: "2022-04-08"
            //     }
            // })
            // var result = [];
            // listUsers.reduce(function (res, value) {
            //     if (!res[value.dateAdd]) {
            //         res[value.dateAdd] = { dateAdd: value.dateAdd, sum: 0 };
            //         result.push(res[value.dateAdd])
            //     }
            //     res[value.dateAdd].sum++;
            //     return res;
            // }, {});
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
                return {
                    name: item.creatorId.fullname,
                    amount: item.amount,
                    description: item.description,
                    status: item.status,
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
    GetSumRevenue: async (req, res) => {
        try {
            let listPayments = await Bill.find()
            var tempTotalRevenue = 0
            listPayments.forEach((item, index) => {
                tempTotalRevenue += item.amount
            })
            return res.status(200).json({ totalRevenue: tempTotalRevenue })
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
            let listBills = await Bill.aggregate([
                {
                    $match: { status: "success" }
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
                            $sum: 50000
                        }
                    }
                },

                {
                    $project: {
                        revenue: 1,
                        date: "$_id",
                        _id: 0
                    }
                }
            ])
            return res.status(200).json(listBills)
            //return res.status(200).json(result)
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Không xác định" })
        }
    },
    /*
    GetTotalCreateNovelByDay: async (req, res) => {
        try {
            let listNovels= await Novel.find()
            listNovels=listNovels.map(item=>{
                return {
                    item,
                    dateAdd:format(item.createdAt, 'yyyy-MM-dd')
                }
            })
            var result = [];
            listNovels.reduce(function(res, value) {
            if (!res[value.dateAdd]) {
                res[value.dateAdd] = { dateAdd: value.dateAdd, sum: 0 };
                result.push(res[value.dateAdd])
            }
            res[value.dateAdd].sum++;
            return res;
            }, {});

            return res.status(200).json(ResponseData(200,result))
            
        } catch (error) {
            console.log(error)
            res.status(500).json(ResponseDetail(500, { message: "Lỗi GetNovels" }))
        }
    },
    */

}

module.exports = { StatisticController }
