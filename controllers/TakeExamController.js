// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");

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

            let exam = await Exam.findOne({ slug }).populate({
                path: "questions.question",
                populate: {
                    path: 'answers',
                    select: 'id content'
                }
            })
                .select({ slug: 1, name: 1, questions: 1, maxTimes: 1, tracking: 1,attemptsAllowed:1 })
            let { questions, startTime, maxTimes, ...data } = exam._doc
            questions = questions.map(item => item.question)

            if (!exam)
                res.status(200).json({ message: 'invalid' })

            const takeExam = await TakeExam.find({ user: user.id, exam: exam.id })
            ///kiểm tra hợp lệ
            if (takeExam.length === 0)
                return res.status(200).json({ message: 'checkpin' })

            const lastTakeExam = takeExam[takeExam.length - 1]
            const remainTime = moment(lastTakeExam.startTime)
                .add(exam.maxTimes, 'minutes')
                .diff(new Date(), 'minutes')
            if (exam.attemptsAllowed === 0) {
                if (lastTakeExam.status === STATUS.SUBMITTED)
                    return res.status(200).json({ message: 'checkpin' })
            }
            else {
                if ((takeExam.length === exam.attemptsAllowed)) {
                    if (lastTakeExam.status === STATUS.SUBMITTED)
                        return res.status(200).json({ message: 'invalid' })//take exam cuối cùng đã hết thời gian
                    if (remainTime < 0)
                        return res.status(200).json({ message: 'invalid' })//take exam cuối cùng đã hết thời gian
                }
                else if (takeExam.length > exam.attemptsAllowed) 
                    return res.status(200).json({ message: 'invalid' })//take exam cuối cùng đã hết thời gian
            }
            if (lastTakeExam.status === STATUS.SUBMITTED)
                return res.status(200).json({ message: 'checkpin' })//take exam cuối cùng đã hết thời gian
            if (remainTime < 0)
                return res.status(200).json({ message: 'checkpin' })//take exam cuối cùng đã hết thời gian

            let endTime = moment(lastTakeExam.startTime).add(maxTimes, 'minutes').toDate()
            return res.status(200).json({
                message: "valid",
                exam: {
                    ...data, questions, endTime
                },
                takeExamId: lastTakeExam.id
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
            const exam = await Exam.findOne({ slug }).populate({
                path: "questions.question",
                populate: {
                    path: 'answers',
                    select: 'id content'
                }
            })
                .select({ slug: 1, name: 1, questions: 1, maxTimes: 1, tracking: 1, pin: 1 })
            let { questions, startTime, maxTimes, ...data } = exam._doc
            let endTime = moment(new Date()).add(maxTimes, 'minutes').toDate()
            questions = questions.map(item => item.question)

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

            const newTakeExam = new TakeExam({
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
            const newExamResult = new ExamResult({ takeExam: takeExam.id })
            await newExamResult.save()
            return res.status(200).json({
                message: "Làm bài thi thành công!",
                takeExamId: takeExam.id,
                exam: {
                    ...data, questions, endTime
                }
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi làm bài thi" })
        }
    },
    submitAnswerSheet: async (req, res) => {
        try {
            const username = req.user.sub
            const { answerSheet, takeExamId } = req.body

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const takeExam = await TakeExam.findById(takeExamId)
            // viết bổ sung thêm kiểm tra thời gian nộp hợp lệ (trễ không quá 2 phút), kiểm tra người làm bài


            const exam = await Exam.findById(takeExam.exam).populate({
                path: "questions.question",
                populate: {
                    path: 'answers',
                    select: 'id isCorrect'
                }
            })

            if (!exam) return res.status(400).json({ message: "Không có bài thi!" })
            let questions = exam.questions.map(element => element.question)//câu hỏi và đáp án từ exam

            let points = 0
            questions.forEach(question => {
                let pointOfQuestion = 0
                let noAnswerCorrect = question.answers.filter(e => e.isCorrect).length //số đáp án đúng
                let questionClient = answerSheet.find(e => e.id === question.id.toString())
                if (!questionClient) {
                    if (questionClient.answerIds.length === 0)
                        points += question.maxPoints
                    else
                        points += 0
                }
                else {
                    if (noAnswerCorrect === 0) {
                        if (questionClient.answerIds.length === 0)
                            points += question.maxPoints
                        else
                            points += 0
                    }
                    else {

                        let pointEachAnswer = question.maxPoints / noAnswerCorrect
                        question.answers.forEach(answer => {
                            if (answer.isCorrect) {//
                                if (questionClient.answerIds.includes(answer.id.toString()))
                                    pointOfQuestion += pointEachAnswer
                            }
                            else {
                                if (questionClient.answerIds.includes(answer.id.toString()))
                                    pointOfQuestion -= pointEachAnswer
                            }

                        })
                        pointOfQuestion = pointOfQuestion > 0 ? pointOfQuestion : 0
                        points += pointOfQuestion
                    }
                }
            })

            takeExam.points = points
            takeExam.status = STATUS.SUBMITTED
            await takeExam.save()

            return res.status(200).json({
                message: "Nộp bài thi thành công!"
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi làm bài thi" })
        }
    }
}

module.exports = { TakeExamController }