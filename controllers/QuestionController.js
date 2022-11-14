/// Tạo câu hỏi 
// - Tạo 1 câu
// - Tạo bằng file
// - Sửa câu hỏi (có đáp án mới thì thêm vào, có gửi kèm id)

const Question = require("../models/Question")
const mongoose = require("mongoose")
const User = require("../models/User")
const Exam = require("../models/Exam")
const Answer = require("../models/Answer")
const TakeExam = require("../models/TakeExam")
const { STATUS } = require("../utils/enum")

const QuestionController = {
    CreateQuestion: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user.sub
            const { examId, type, content, maxPoints, answers, image } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam) return res.status(400).json({ message: "Không tồn tại!" })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            const newQuestion = new Question({

                type,
                content,
                maxPoints,
                answers: [],
                image
            })
            let error = newQuestion.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo câu hỏi thất bại!"
                })
            }

            await Promise.all(answers.map(async (element) => {
                const answer = new Answer({
                    content: element.content || "",
                    isCorrect: element.isCorrect || false
                })
                await answer.save()
                newQuestion.answers.push(answer.id)
            }))

            console.log(await (await newQuestion.save()).populate('answers'))
            exam.questions.push({ question: newQuestion.id })
            exam.maxPoints += newQuestion.maxPoints
            exam.numberofQuestions += 1
            await exam.save()
            console.log(new Date().getTime() - start.getTime())
            return res.status(200).json({
                message: "Tạo câu hỏi mới thành công!",
                question: newQuestion
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    },

    DeleteQuestion: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user.sub
            const { examId, questionId } = req.query
            //if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam) return res.status(400).json({ message: "Không tồn tại!" })
            if (exam.status === STATUS.PUBLIC) return res.status(400).json({ message: "Không thể xóa câu hỏi" })
            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })

            exam.questions = exam.questions.filter(item => item.question.toString() !== question.id.toString())
            exam.maxPoints -= question.maxPoints
            exam.numberofQuestions -= 1
            await exam.save()

            await question.deleteOne()
            console.log(new Date().getTime() - start.getTime())
            return res.status(200).json({
                message: "Xoá câu hỏi mới thành công!"
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    },
    CreateQuestionByFile: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user.sub
            let { examId, questions } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam) return res.status(400).json({ message: "Không tồn tại!" })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            questions = questions.map(async (question) => {
                const newQuestion = new Question({

                    type: question.type,
                    content: question.content,
                    maxPoints: question.maxPoints,
                    answers: [],
                    image: question.image
                })
                let error = newQuestion.validateSync()
                if (error) {
                    console.log(error)
                    return res.status(400).json({
                        message: "Tạo câu hỏi thất bại!"
                    })
                }

                await Promise.all(question.answers.map(async (element) => {
                    const answer = new Answer({
                        content: element.content || "",
                        isCorrect: element.isCorrect || false
                    })
                    await answer.save()
                    newQuestion.answers.push(answer.id)
                }))

                exam.maxPoints += newQuestion.maxPoints
                exam.numberofQuestions += 1
                exam.questions.push({ question: newQuestion.id })

                return newQuestion.save()

            });
            await Promise.all(questions)

            await exam.save()
            console.log(new Date().getTime() - start.getTime())
            return res.status(200).json({
                message: "Tạo câu hỏi mới thành công!",
                //question: newQuestion,

            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    },
    UpdateQuestionInExam: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user.sub
            const { examId, questionId, type, content, maxPoints, answers } = req.body
            //if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })

            if (!exam) return res.status(400).json({ message: "Không tồn tại bài thi!" })

            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })

            exam.maxPoints -= question.maxPoints


            let newAnswers = []

            await Promise.all(answers.map(async (element) => {
                if (mongoose.Types.ObjectId.isValid(element.id)) {
                    const answer = await Answer.findByIdAndUpdate(element.id, {
                        content: element.content || "",
                        isCorrect: element.isCorrect || false
                    }, { upsert: true })
                    newAnswers.push(answer.id)
                }
                else {
                    let newAnswer = new Answer({ content: element.content, isCorrect: element.isCorrect })
                    await newAnswer.save()
                    newAnswers.push(newAnswer.id)
                }
            }))
            let newData = {
                type,
                content,
                maxPoints,
                answers: newAnswers
            }

            exam.maxPoints += newData.maxPoints

            let takeExams = await TakeExam.find({
                "result.question": { $in: mongoose.Types.ObjectId(questionId) }
            })
            let points = 0
            let newTakeExams = takeExams.map(takeExam => {
                let result = takeExam.result
                let cauHoiNguoiDungDaChon = result.find(item => item.question.toString() === question.id.toString())

                let pointOfQuestion = 0
                let noAnswerCorrect = answers.filter(e => e.isCorrect).length //số đáp án đúng
                //thay bằng Question result, answer
                if (!result) {
                    if (noAnswerCorrect === 0)
                        points += maxPoints
                    else
                        points += 0
                }
                else {
                    if (noAnswerCorrect === 0) {
                        if (cauHoiNguoiDungDaChon.answers.length === 0)
                            points += maxPoints
                        else
                            points += 0
                    }
                    else {
                        let pointEachAnswer = maxPoints / noAnswerCorrect
                        answers.forEach(answer => {
                            if (answer.isCorrect) {//
                                if (cauHoiNguoiDungDaChon.answers.includes(answer.id.toString()))
                                    pointOfQuestion += pointEachAnswer
                            }
                            else {
                                if (cauHoiNguoiDungDaChon.answers.includes(answer.id.toString()))
                                    pointOfQuestion -= pointEachAnswer
                            }

                        })

                        pointOfQuestion = pointOfQuestion > 0 ? pointOfQuestion : 0
                        takeExam.points = takeExam.points - cauHoiNguoiDungDaChon.point + pointOfQuestion
                        cauHoiNguoiDungDaChon.point = pointOfQuestion

                    }
                }
                return {
                    updateOne:
                    {
                        "filter": { _id: takeExam.id },
                        "update": {
                            points: takeExam.points,
                            result: takeExam.result
                        },

                    }
                }
            })
            await TakeExam.bulkWrite(newTakeExams)
            await exam.save()

            let updatedQuestion = await Question.findByIdAndUpdate({ _id: questionId }, newData).populate('answers')
            return res.status(200).json({
                updatedQuestion
                //question: exitsQuestion
            })
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    }

}

module.exports = { QuestionController }