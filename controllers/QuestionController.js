/// Tạo câu hỏi 
// - Tạo 1 câu
// - Tạo bằng file
// - Sửa câu hỏi (có đáp án mới thì thêm vào, có gửi kèm id)

const Question = require("../models/Question")
const mongoose = require("mongoose")
const User = require("../models/User")
const Exam = require("../models/Exam")
const Answer = require("../models/Answer")
const QuestionBank = require("../models/QuestionBank")
const TakeExam = require("../models/TakeExam")
const { STATUS, ANSWERTYPE, QUESTIONTYPE } = require("../utils/enum")

const QuestionController = {
    CreateQuestion: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user?.sub
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
                    isCorrect: element.isCorrect || false,
                    type: element.type
                })
                await answer.save()
                newQuestion.answers.push(answer.id)
            }))

            await (await newQuestion.save()).populate('answers')
            exam.questions.push({ question: newQuestion.id })
            exam.questions = exam.questions.map((item, index) => ({ ...item._doc, index: index + 1 }))//cập nhật lại index câu hỏi
            exam.maxPoints = Number(exam.maxPoints) + Number(newQuestion.maxPoints)
            exam.numberofQuestions += 1
            await exam.save()
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
            const username = req.user?.sub
            const { examId, questionId } = req.body
            //if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam) return res.status(400).json({ message: "Không tồn tại!" })
            if (exam.status === STATUS.PUBLIC) return res.status(400).json({ message: "Không thể xóa câu hỏi trong bài thi đã được phát hành!" })
            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })

            exam.questions = exam.questions.filter(item => item.question.toString() !== question.id.toString())

            exam.questions = exam.questions.map((item, index) => ({ ...item._doc, index }))

            exam.maxPoints = Number(exam.maxPoints) - Number(question.maxPoints)

            exam.numberofQuestions = Number(exam.numberofQuestions) - 1

            let listQuestionBank = await QuestionBank.find({
                questions: { $in: [mongoose.Types.ObjectId(questionId)] }
            })

            let listExam = await Exam.find({
                '$and': [
                    { 'questions.question': { '$in': [question.id] } },
                    { '_id': { '$ne': exam.id } }
                ]
            })
            await exam.save()

            if (listExam.length === 0 && listQuestionBank.length === 0) {
                //nếu không thuộc QB và Exam khác thì xoá câu hỏi trên db
                await question.deleteOne()
            }

            // if (questionBank) {
            //     questionBank.questions = questionBank.questions.filter(item => item.question.toString() !== questionId)
            // }

            return res.status(200).json({
                message: "Xoá câu hỏi thành công!"
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xóa câu hỏi!" })
        }
    },
    DeleteQuestionInQuestionBank: async (req, res) => {
        try {
            const username = req.user?.sub
            const { questionBankId, questionId } = req.body
            //if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })
            const questionBank = await QuestionBank.findOne({ _id: mongoose.Types.ObjectId(questionBankId), creatorId: user._id })
            if (!questionBank) return res.status(400).json({ message: "Không tồn tại!" })

            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })

            questionBank.questions = questionBank.questions
                .filter(item => item.toString() !== question.id.toString())

            await questionBank.save()
            let listExam = await Exam.find({
                'questions.question': { '$in': [question.id] }
            })
            if (listExam.length === 0) {
                //nếu không thuộc QB và Exam khác thì xoá câu hỏi trên db
                await question.deleteOne()
            }

            return res.status(200).json({
                message: "Xoá câu hỏi thành công!"
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xóa câu hỏi!" })
        }
    },
    CreateQuestionByFile: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user?.sub
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
                    newQuestion.answers.push(answer.id)
                    answer.save()
                }))

                exam.maxPoints = Number(exam.maxPoints) + Number(newQuestion.maxPoints)
                exam.numberofQuestions += 1
                exam.questions.push({
                    index: exam.questions.length + 1,
                    question: newQuestion.id
                })

                return newQuestion.save()

            });
            questions = await Promise.all(questions)
            await exam.save()
            new Date().getTime() - start.getTime()
            return res.status(200).json({
                message: "Tạo câu hỏi mới thành công!",
                questions

            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    },

    UpdateQuestionInExam: async (req, res) => {
        try {
            let start = new Date()
            const username = req.user?.sub
            const { examId, questionId, type, content, maxPoints, answers } = req.body
            //if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            // const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })

            // if (!exam) return res.status(400).json({ message: "Không tồn tại bài thi!" })

            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })

            // exam.maxPoints -= question.maxPoints


            let newAnswers = []

            await Promise.all(answers.map(async (element) => {
                if (mongoose.Types.ObjectId.isValid(element.id)) {
                    newAnswers.push(element.id)
                    return Answer.findByIdAndUpdate(element.id, {
                        content: element.content || "",
                        isCorrect: element.isCorrect || false,
                        type: element.type
                    }, { upsert: true })

                }
                else {
                    let newAnswer = new Answer({ content: element.content, isCorrect: element.isCorrect })

                    newAnswers.push(newAnswer.id)
                    return newAnswer.save()
                }
            }))
            let newData = {
                type,
                content,
                maxPoints,
                answers: newAnswers
            }

            let exams = await Exam.find({
                "questions.question": { $in: mongoose.Types.ObjectId(questionId) }
            })

            let newExam = exams.map(exam => {
                let maxPoints = Number(exam.maxPoints) - Number(question.maxPoints) + Number(newData.maxPoints)

                return {
                    updateOne:
                    {
                        "filter": { _id: exam.id },
                        "update": {
                            maxPoints: maxPoints
                        },

                    }
                }
            })
            //

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
                        pointOfQuestion = maxPoints
                }
                else {
                    if (newData.type === QUESTIONTYPE.FILLIN) {
                        let isCorrect = answers.some(answer => {
                            if (cauHoiNguoiDungDaChon.answers.length !== 0) {
                                if (answer.type === ANSWERTYPE.EQUAL) {
                                    return cauHoiNguoiDungDaChon.answers[0] === answer.content
                                }
                                else {
                                    return answer.content.includes(cauHoiNguoiDungDaChon.answers[0])
                                }
                            }
                            return false
                        })
                        pointOfQuestion = isCorrect ? maxPoints : 0
                    }
                    else {
                        if (noAnswerCorrect === 0) {
                            if (cauHoiNguoiDungDaChon.answers.length === 0)
                                pointOfQuestion = maxPoints
                        }
                        else {
                            let pointEachAnswer = maxPoints / noAnswerCorrect

                            answers.forEach(answer => {
                                if (cauHoiNguoiDungDaChon.answers.includes(answer.id.toString()))
                                    if (answer.isCorrect) {//
                                        pointOfQuestion += pointEachAnswer
                                    }
                                    else {
                                        pointOfQuestion -= pointEachAnswer
                                    }
                            })
                        }
                    }

                }
                pointOfQuestion = pointOfQuestion > 0 ? pointOfQuestion : 0
                takeExam.points = takeExam.points - cauHoiNguoiDungDaChon.point + pointOfQuestion
                cauHoiNguoiDungDaChon.point = pointOfQuestion
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
            await Exam.bulkWrite(newExam)

            let updatedQuestion = await Question.findByIdAndUpdate({ '_id': new mongoose.Types.ObjectId(question.id) }, newData, { new: true }).populate('answers')
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