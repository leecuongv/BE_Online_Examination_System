
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT, ROLES } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");

const AdminController = {

    activeByAdmin: async (req, res) => {
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
            const userId = req.body.userId;
            const updateUser = await User.findByIdAndUpdate(userId, { active: true }, { new: true }).populate('roles')

            if (updateUser)
                return res.status(200).json(ResponseData(200, updateUser))
            return res.status(400).json(ResponseDetail(400, { message: "Kích hoạt tài khoản thất bại" }))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi kích hoạt tài khoản" }))
        }
    },

    inactiveByAdmin: async (req, res) => {
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
            const userId = req.body.userId;
            const updateUser = await User.findByIdAndUpdate(userId, { active: false }, { new: true }).populate('roles')
            if (updateUser)
                return res.status(200).json(ResponseData(200, updateUser))
            return res.status(400).json(ResponseDetail(400, { message: "Hủy kích hoạt tài khoản thất bại" }))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi hủy kích hoạt tài khoản" }))
        }
    },

    updateRoles: async (req, res) => {
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
            const rolesRequest = req.body.roles;
            const username = req.body.username;
            let roles = []
            const getRoles = async (list) => {
                const roles = []
                for (let i = 0; i < list.length; i++) {
                    let role = await Role.findOne({ name: list[i] })
                    roles.push(role)
                }
                return roles
            }
            roles = await getRoles(rolesRequest)
            if (username) {
                const newUser = await User.updateOne({ username }, { roles: roles.map(item => item.id) }, { new: true })
                if (newUser) {
                    return res.status(200).json(ResponseData(200, { message: "Cập nhật quyền thành công" }))
                }
                else
                    return res.status(400).json(ResponseDetail(400, { message: "Cập nhật không thành công" }))
            } else
                return res.status(400).json(ResponseDetail(400, { message: "Không có username" }))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi cập nhật quyền tài khoản" }))
        }
    },

    deleteAccount: async (req, res) => {
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
            const userId = req.body.userId;
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
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi xóa người dùng" }))
        }
    },

    GetListUser: (req, res) => {
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
            User.find().sort({ fullname: -1 })
                .then(result => {
                    res.status(200).json(ResponseData(200, result))
                }).
                catch(err => {
                    console.log(err)
                    res.status(400).json(ResponseDetail(400, { message: "Lỗi lấy danh sách người dùng!" }))
                })
        } catch (error) {
            console.log(error)
            res.status(400).json(ResponseDetail(400, { message: "Lỗi lấy danh sách người dùng" }))
        }
    },
    deleteCourseById: async(req, res)=>{
        try(
            const admin = req.user.sub
            if (!admin)
                return res.status(400).json({
                    message: "Không tồn tại tài khoản"
                })
            if (admin.role !== ROLES.ADMIN)
                return res.status(400).json({
                    message: "Không có quyền truy cập"
                })
            const courseId = req.query.id
            const course = await Course.findById(courseId)
            if(!course)
            return res.status(400).json({
                message:"Không tồn tại khóa học!"
            })
        )
        catch(){
            
        }
    }
}


/*
    deleteNovelById: async(req,res) => {
        try {
            const novelId = req.body.novelId
            const novel = await Novel.findOne({ _id: novelId })
            if (novel) {
                const response = await Novel.deleteOne({ _id: novel._id })
                if (response.deletedCount == 1)
                    return res.status(200).json(ResponseData(200, { message: "Xoá truyện thành công" }))
                return res.status(400).json(ResponseDetail(400, { message: "Xoá truyện không thành công" }))

            }
            else
                return res.status(400).json(ResponseDetail(400, { message: "Không tìm thấy truyện" }))
        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi sửa truyện" }))
        }
    },

    GetNovels: (req, res) => {
        try {

            Novel.find().sort({ name: -1 })
                .then(result => {
                    res.status(200).json(ResponseData(200, result))
                }).
                catch(err => {
                    console.log(err)
                    res.status(500).json(ResponseDetail(500, { message: "Lỗi GetNovels" }))
                })
        } catch (error) {
            console.log(error)
            res.status(500).json(ResponseDetail(500, { message: "Lỗi GetNovels" }))
        }
    },
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
    updateDeleteStatus: async (req,res) => {
        try {
            const username = req.body.username;
            const updateUser = await User.findOneAndUpdate( {username:username}, { isDeleted: false })
            if (updateUser)
            {
                updateUser['isDeleted']=true
                return res.status(200).json(ResponseData(200, updateUser))
            }
                
            return res.status(400).json(ResponseDetail(400, {message:"Xóa tài khoản thất bại"}))
        }
        catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(500, { message: "Lỗi xóa tài khoản" }))
        }
    },
    GetListOfComments: async (req, res) => {
        try {
            let comments = await Comment.find().sort({createdAt:-1}).populate('userId').populate('novelId')
                comments=comments.map(item=>{return {
                    nickname:item.userId.nickname,
                    image:item.userId.image,
                    content:item.content,
                    id:item.id,
                    novelname:item.novelId.name,
                    username:item.userId.username,
                    createdAt:item.createdAt
                }})
                return res.status(200).json(ResponseData(200, comments))

        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(200, { message: "Lỗi tạo comment" }))
        }
    },
    GetListRating: async (req, res) => {
        try {
            let ratings = await Rating.find().sort({createdAt:-1}).populate('userId').populate('novelId')
                ratings=ratings.map(item=>{return {
                    nickname:item.userId.nickname,
                    image:item.userId.image,
                    content:item.content,
                    id:item.id,
                    username:item.userId.username,
                    novelname:item.novelId.name,
                    rating: item.rating,
                    createdAt:item.createdAt,
                }})
                return res.status(200).json(ResponseData(200, ratings))
        } catch (error) {
            console.log(error)
            return res.status(500).json(ResponseDetail(200, { message: "Lỗi tạo comment" }))
        }
    },
} */