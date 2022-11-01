// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const { STATUS } = require("../utils/enum");
const moment = require("moment/moment");

const TakeExamController = {
    getExam: async (takeExam) => {
        let exam = await Exam.findById(takeExam.exam).populate({
            path: "questions.question",
            populate: {
                path: 'answers',
                select: 'id content'
            }
        })
            .select({ slug: 1, name: 1, questions: 1, maxTimes: 1, tracking: 1 })
        let { questions, startTime, maxTimes, ...data } = exam._doc
        let endTime = moment(takeExam.startTime).add(maxTimes, 'minutes').toDate()
        // console.log(moment(new Date(startTime)).toDate())
        // console.log(moment(startTime).add(maxTimes, 'minutes').toDate())
        questions = questions.map(item => item.question)
        return { ...data, endTime, questions }
    },
    CheckTakeExamId: async (req, res) => {
        try {
            const username = req.user.sub
            const { takeExamId } = req.body

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const takeExam = await TakeExam.findById(takeExamId)
            if (!takeExam || takeExam.status === STATUS.SUBMITTED)
                return res.status(200).json({ message: 'invalid' })

            const exam = await TakeExamController.getExam(takeExam)
            return res.status(200).json({
                message: "valid",
                exam: exam
            })

        } catch (error) {
            console.log(error)
            return res.status(400).json({ message: "Lỗi làm bài thi" })
        }
    },
    CheckExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { slug } = req.body

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const exam = await TakeExamController.getExam(takeExam.exam)

            if (!exam)
                res.status(200).json({ message: 'invalid' })

            const takeExam = await TakeExam.find({ user: user.id, exam: exam.id })
            ///kiểm tra hợp lệ
            console.log(takeExam)
            if (takeExam.length === 0)
                return res.status(200).json({ message: 'checkpin' })
            if ((takeExam.length >= exam.attemptsAllowed && exam.attemptsAllowed !== 0))
                return res.status(200).json({ message: 'invalid' })
            if (takeExam[takeExam.length - 1].status === STATUS.SUBMITTED)
                return res.status(200).json({ message: 'checkpin' })
            return res.status(200).json({
                message: "valid",
                exam: exam,
                takeExamId: takeExam[takeExam.length - 1].id
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi làm bài thi" })
        }
    },
    CreateTakeExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { slug, pin } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const exam = await Exam.findOne({ slug }).populate("questions.question")

            if (exam.pin !== pin) return res.status(400).json({ message: "Sai mật khẩu!" })

            if (!exam) return res.status(400).json({ message: "Không có bài thi!" })
            const course = await Course.findOne({
                $and: [
                    {
                        $or: [
                            { 'students': { $in: [user.id] } }, { creatorId: user.id }
                        ]
                    },
                    { 'exams': { $in: [exam._id] } }
                ]
            })
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
    },
}

module.exports = { TakeExamController }