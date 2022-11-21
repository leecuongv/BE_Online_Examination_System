// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");
const  Bill  = require('../models/Bill')
const StatisticController = {
    getTakeExamByStudent: async (req, res) => {
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
                points = result.reduce((total, current)=>{
                    
                    total+= current.point
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
    getTakeExamByTeacher: async (req, res) => {
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
            let takeExams = await TakeExam.find({ examId: exam.id }).populate('userId')
            takeExams = takeExams.map(item => {
                console.log(item)
                let { result, points, userId, ...data } = item._doc
                points = result.reduce((total, current)=>{
                    
                    total+= current.point
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
    getAllBill: async(req,res) => {
        try{
            let listPayments = await Bill.find().populate('creatorId')
            listPayments=listPayments.map(item=>{return {
                id:item.id,
                orderId:item.orderId,
                fullname:item.creatorId.fullname,
                amount:item.amount,
                description:item.description,
                status:item.status,
                method:item.method,
                updatedAt: item.updatedAt
            }})
            return res.status(200).json(listPayments)
        }catch(error){
            console.log(error)
            return res.status(500).json({message:"Không xác định"})
        }
    }

}

module.exports = { StatisticController }