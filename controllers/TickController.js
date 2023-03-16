const Tick = require("../models/Tick")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const Assignment = require("../models/Assignment")
const Exam = require("../models/Exam")
const Lesson = require("../models/Lesson")
const { STATUS } = require("../utils/enum");

const TickController = {
    Create: async (req, res) => {
        try {
            const username = req.user.sub
            const { tickId, date, activity } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })


            if (date === null
                || new Date(date).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của đánh dấu không hợp lệ" })

            }
            const newTick = await new Tick({
                date,
                activity,

            })
            let error = newTick.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo đánh dấu thất bại!"
                })
            }
            const tick = await newTick.save();


            return res.status(200).json({
                message: "Tạo đánh dấu mới thành công!",
                tick: tick._doc
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo đánh dấu!" })
        }
    },

    Update: async (req, res) => {
        try {
            const username = req.user.sub
            const { tickId, date, activity } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const existTick = await Tick.findOne({tickId: tickId})
            if (!existTick) return res.status(400).json({ message: "Không có đánh dấu" })


            if (date === null
                || new Date(date).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của đánh dấu không hợp lệ" })

            }


            let newData = {
                date,
                activity,

            }

            let updatedTick = await Tick.findOneAndUpdate({ tickId: tickId }, newData, { new: true })


            return res.status(200).json({
                updatedTick
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo đánh dấu" })
        }
    },

    Delete: async (req, res) => {
        try {
            const username = req.user.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsTick = await Tick.findById(id)
            if (!exitsTick) return res.status(400).json({ message: "Không có đánh dấu" })

            exitsTick = await Tick.deleteOne({ "_id": mongoose.Types.ObjectId(id) })


            return res.status(200).json({
                message: "Xóa đánh dấu thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xóa đánh dấu" })
        }
    },
    getByID: async (req, res) => {
        try {
            const username = req.user.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsTick = await Tick.findById(id)
            if (!exitsTick) return res.status(400).json({ message: "Không có đánh dấu" })

            return res.status(200).json({
                exitsTick: exitsTick._doc
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi lấy thông tin đánh dấu" })
        }
    },
    getByTickID: async (req, res) => {
        try {
            const username = req.user.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsTick = await Tick.findOne({ tickId: id })
            if (!exitsTick) return res.status(400).json({ message: "Không có đánh dấu" })

            return res.status(200).json({
                exitsTick: exitsTick._doc
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi lấy thông tin đánh dấu" })
        }
    },
    GetTickInCourseByStudentId: async(req, res)=>{
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const course = await Course.findOne({ courseId })
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            let listAssignment = await Assignment.aggregate([
                {
                    $match: {
                        courseId: course._id,
                        status: STATUS.PUBLIC
                    }
                },
            ])

            //Trong các khóa học có sinh viên, lấy danh sách assignment, exam với các mốc thời gian và add vào cục bo chung

            return res.status(200).json(listAssignment)


        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài tập" })
        }
    },

};


module.exports = { TickController }
