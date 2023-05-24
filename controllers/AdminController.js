const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const TransactionHistory = require("../models/TransactionHistory")
const { STATUS, VIEWPOINT, ROLES } = require("../utils/enum");
const moment = require("moment/moment");
const { response } = require("express");

const AdminController = {


    updateStatus: async (req, res) => {
        try {

            const { userId, status } = req.body;
            const updateUser = await User.findByIdAndUpdate(userId, { status: status }, { new: true })

            if (updateUser)
                return res.status(200).json(updateUser)
            return res.status(400).json({ message: "Kích hoạt tài khoản thất bại" })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi kích hoạt tài khoản" })
        }
    },

    updateUserRole: async (req, res) => {
        try {

            const { username, role } = req.body;

            if (username) {
                const newUser = await User.updateOne({ username }, { role: role }, { new: true })
                if (newUser)
                    return res.status(200).json({ message: "Cập nhật quyền thành công" })

                else
                    return res.status(400).json({ message: "Cập nhật không thành công" })
            } else
                return res.status(400).json({ message: "Không có username" })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi cập nhật quyền tài khoản" })
        }
    },

    deleteUserById: async (req, res) => {
        try {

            const userId = req.query.id;
            const user = await User.findById(userId)
            if (!user)
                return res.status(400).json({
                    message: "Không tìn thấy người dùng!"
                })
            let name = user.fullname
            let deleteUser = User.findByIdAndDelete(userId)
            if (deleteUser)
                return res.status(200).json({
                    message: "Xóa người dùng " + name + " thành công!"
                })
            return res.status(200).json({
                message: "Xóa người dùng " + name + " thất bại!"
            })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi xóa người dùng" })
        }
    },

    GetListUser: (req, res) => {
        try {

            User.find().sort({ fullname: -1 })
                .then(result => {
                    res.status(200).json(result)
                }).
                catch(err => {
                    console.log(err)
                    res.status(400).json({ message: "Lỗi lấy danh sách người dùng!" })
                })
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi lấy danh sách người dùng" })
        }
    },

    deleteCourseById: async (req, res) => {
        try {

            const courseId = req.query.id
            const course = await Course.findById(courseId)
            if (!course)
                return res.status(400).json({
                    message: "Không tồn tại khóa học!"
                })
            let courseName = course.name
            let deleteCourse = Course.findByIdAndDelete(courseId)
            if (deleteCourse)
                return res.status(200).json({
                    message: "Xóa khóa học " + courseName + " thành công!"
                })
            return res.status(200).json({
                message: "Xóa khóa học " + courseName + " thất bại!"
            })
        }
        catch (error) {
            res.status(400).json({ message: "Lỗi xóa khóa học" })
        }
    },

    GetListCourse: (req, res) => {
        try {
            Course.find().sort({ name: -1 })
                .then(result => {
                    res.status(200).json(result)
                }).
                catch(err => {
                    console.log(err)
                    res.status(500).json({ message: "Lấy danh sách khóa học thất bại" })
                })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi lấy danh sách khóa học!" })
        }
    },
    HappyNewYear: async (req, res) => {
        try {
            return res.status(201).json({ message: "Chúc bạn một năm mới tràn đầy sức khỏe, vạn sự thăng hoa, tiền đồ rộng mở , gia đình hạnh phúc nha ☆*: .｡. o(≧▽≦)o .｡.:*☆!" })
        } catch (error) {

        }
    },

    UpdateTransactionStatus: async (req, res) => {
        try {
            const { transactionId, isTransferred } = req.body

            const transactionHistory = await TransactionHistory.findOneAndUpdate({ transactionId: transactionId }, { isTransferred }, { new: true })

            if (!transactionHistory)
                return res.status(400).json({ message: "Không tồn tại giao dịch!" })

            return res.status(200).json({ message: "Cập nhật trạng thái giao dịch thành công!" })
        } catch (error) {

        }
    },
    ViewTransactionHistory: async (req, res) => {
        try {
            const transactionHistory = await TransactionHistory.find({ status: STATUS.SUCCESS })
            if (transactionHistory.length <= 0)
                return res.status(400).json({ message: "Không tồn tại giao dịch!" })

            return res.status(200).json(transactionHistory)
        } catch (error) {

        }
    }


}


/*
   
    GetBills: async (req, res) => {
        try{
            let listPayments= await Bill.find().populate('userId').populate('orderId')
            // listPayments=listPayments.map(item=>{return {
            //     orderId:item.orderId,
            //     name:item.userId.nickname,
            //     amount:item.amount,
            //     description:item.description,
            //     status:item.status,
            //     createdAt: item.createdAt
            // }})
            return res.status(200).json(ResponseData(200,listPayments))
        }catch(error){
            console.log(error)
            return res.status(500).json(ResponseDetail(500,{message:"Không xác định"}))
        }
    },
    GetUserById: async (req,res)=>{
        try {
            const userId=req.body.userId
            const user =await User.findOne({_id:userId}).populate("roles");

            return res.status(200).json(ResponseData(200,{userInfo:user}))
        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500,{message:"Lỗi xác thực"}))
        }
    },
    inactiveWithIdByAdmin: async (req, res) => {
        try {
            const userId = req.body.userId;
            const updateUser = await User.findOneAndUpdate({ userId:userId }, { active: false }, { new: true }).populate('roles')
            if (updateUser)
                return res.status(200).json(ResponseData(200, updateUser))
            return res.status(400).json(ResponseDetail(400,  {message:"Khoá thất bại"}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },



} */
module.exports = { AdminController }