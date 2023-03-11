const Tick = require("../models/Tick")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
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


};


module.exports = { TickController }
