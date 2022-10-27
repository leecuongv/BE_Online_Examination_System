// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam")

const TakeExamController = {
    CreateTakeExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { slug, pin } = req.body
            
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const exam = await Exam.findOne({ slug }).populate("exams")

            if(exam.pin !== pin) return res.status(400).json({message: "Sai mật khẩu!"})

            if (!exam) return res.status(400).json({ message: "Không có bài thi!" })
            const course = await Course.findOne({ 'students': { $in: [user._id] }, exams: { $in: [exam._id] } })
            if (!course) return res.status(400).json({ message: "Thí sinh không thuộc bài thi này!" })

            const newTakeExam = await new TakeExam({
                slug,
                exam: exam.id,
                user: user.id,

            })
            let error = newTakeExam.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Làm bài thi thất bại!"
                })
            }
            const takeExam = await newTakeExam.save()
            return res.status(200).json({
                message: "Làm bài thi thành công!",
                exam: exam._doc
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi làm bài thi" })
        }
    }
}
