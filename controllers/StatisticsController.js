// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");

const StatisticController = {
    GetTakeExamByStudent: async (req, res) => {
        try {

            const username = req.user.sub
            const { examSlug } = req.query

            const user = await User.findOne({ username })
            if (!user) return res.status(200).json({ message: "Không có tài khoản" })

            const exam = await Exam.findOne({ slug: examSlug })
            if (!exam) return res.status(200).json({ message: "Không tìm thấy khoá học" })
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
                    name: userId.fullname,
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
            if (!exam) return res.status(200).json({ message: "Không tìm thấy khoá học" })

            if (exam.creatorId.toString() !== user.id.toString()) {//nếu không phải người tạo khoá học thì không trả về kết quả
                return res.status(403).json({ message: "Không có quyền truy cập" })
            }
            let takeExams = await TakeExam.find({ examId: exam.id })
                .populate({
                    path: 'userId',
                    //select: 'fullname'
                })
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
                    name: userId.fullname,
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
    GetNumberOfCourses: async (req, res) => {
        try {
            const admin = req.user.sub
            if (!admin)
                return res.status(400).json({
                    message: "Không tồn tại tài khoản"
                })
            if (admin.role !== ROLES.ADMIN)
                return res.status(400).json({
                    message: "Không có quyền truy cập"
                })
            const numberOfCourses = await Course.countDocuments()
            if (!numberOfCourses)
                return res.status(400).json({
                    message: "Không đếm được số lượng khóa học!"
                })
            return res.status(400).json({
                numberOfCourses
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng khóa học!" })
        }
    },
    GetNumberOfExams: async (req, res) => {
        try {
            const admin = req.user.sub
            if (!admin)
                return res.status(400).json({
                    message: "Không tồn tại tài khoản"
                })
            if (admin.role !== ROLES.ADMIN)
                return res.status(400).json({
                    message: "Không có quyền truy cập"
                })
            const numberOfExam = await Exam.countDocuments()
            if (!numberOfExam)
                return res.status(400).json({
                    message: "Không đếm được số lượng bài kiểm tra!"
                })
            return res.status(400).json({
                numberOfExam
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng bài kiểm tra!" })
        }
    },
    GetNumberOfUsers: async (req, res) => {
        try {
            const admin = req.user.sub
            if (!admin)
                return res.status(400).json({
                    message: "Không tồn tại tài khoản"
                })
            if (admin.role !== ROLES.ADMIN)
                return res.status(400).json({
                    message: "Không có quyền truy cập"
                })
            const numberOfUsers = await User.countDocuments()
            if (!numberOfUsers)
                return res.status(400).json({
                    message: "Không đếm được số lượng người dùng!"
                })
            return res.status(400).json({
                numberOfUsers
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi đếm số lượng người dùng!" })
        }
    },

    GetTotalNewUsersByDay: async (req, res) => {
        try {
            const admin = req.user.sub
            if (!admin)
                return res.status(400).json({
                    message: "Không tồn tại tài khoản"
                })
            if (admin.role !== ROLES.ADMIN)
                return res.status(400).json({
                    message: "Không có quyền truy cập"
                })
            let listUsers = await User.find()
            listUsers = listUsers.map(item => {
                if (item._doc.hasOwnProperty('createdAt')) {
                    return {
                        item,
                        dateAdd: format(item.createdAt, 'yyyy-MM-dd')
                    }
                }
                return {
                    item,
                    dateAdd: "2022-04-08"
                }
            })
            var result = [];
            listUsers.reduce(function (res, value) {
                if (!res[value.dateAdd]) {
                    res[value.dateAdd] = { dateAdd: value.dateAdd, sum: 0 };
                    result.push(res[value.dateAdd])
                }
                res[value.dateAdd].sum++;
                return res;
            }, {});

            return res.status(200).json(result)
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
            return res.status(200).json(ResponseData(200, listPayments))
        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Không xác định" }))
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
            let listPayments = await Bill.find()
            listPayments = listPayments.map(item => {
                return {
                    item,
                    dateAdd: format(item.createdAt, 'yyyy-MM-dd')
                }
            })
            var result = [];
            listPayments.reduce(function (res, value) {
                if (!res[value.dateAdd]) {
                    res[value.dateAdd] = { dateAdd: value.dateAdd, amount: 0 };
                    result.push(res[value.dateAdd])
                }
                res[value.dateAdd].amount += value.item.amount;
                return res;
            }, {});

            return res.status(200).json(result)
        } catch (error) {
            console.log(error)
            return res.status(500).json( { message: "Không xác định" })
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