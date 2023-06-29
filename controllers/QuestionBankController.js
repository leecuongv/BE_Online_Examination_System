const QuestionBank = require("../models/QuestionBank")
const User = require("../models/User")
const mongoose = require("mongoose")
const generator = require("generate-password")
const { ROLES, STATUS } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
const TakeExam = require("../models/TakeExam")
const Question = require("../models/Question")
const Answer = require("../models/Answer")
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});
const QuestionBankController = {
    CreateQuestionBank: async (req, res) => {
        try {
            const { name, description } = req.body
            const username = req.user?.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const existQuestionBank = await QuestionBank.findOne({ name: name, creatorId: user._id })
            if (existQuestionBank) return res.status(400).json({ message: "Trùng tên với ngân hàng câu hỏi trước đó" })
            const newQuestionBank = new QuestionBank({
                name,
                description,
                creatorId: user.id,
                questions: []
            });
            let error = newQuestionBank.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo ngân hàng câu hỏi không thành công"
                })

            const questionBank = await newQuestionBank.save();
            return res.status(200).json({
                message: "Tạo ngân hàng câu hỏi thành công",
                questionBankId: questionBank._doc.questionBankId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },
    getQuestionBankBySlug: async (req, res) => {
        try {
            const { slug } = req.query
            const questionBank = await QuestionBank.findOne({ slug: slug })
            if (questionBank) {
                const { name, description, questions, image, status } = questionBank._doc
                return res.status(200).json({ name, description, image, status })
            }

            return res.status(400).json({
                message: "Không tìm thấy ngân hàng câu hỏi",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },
    getListQuestionBankByTeacher: async (req, res) => {
        try {
            const username = req.user?.sub

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có tài khoản" })

            const questionBanks = await QuestionBank.find({ creatorId: user.id })

            if (questionBanks) {
                return res.status(200).json(questionBanks)
            }

            return res.status(400).json({
                message: "Không tìm thấy ngân hàng câu hỏi",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },
    getListQuestionOfQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const slug = req.query.slug
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const listQuestion = await QuestionBank.findOne({ slug })
                .populate({
                    path: 'questions',
                    populate: {
                        path: 'answers'
                    }
                })

            if (listQuestion) {
                // const result = listExam.map(item => {
                //     let { id, name } = item
                //     return { id, name, count: item.count }
                // })
                return res.status(200).json(listQuestion)
            }
            return res.status(400).json({
                message: "Không tìm thấy ngân hàng câu hỏi",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },
    getListQuestionByListQB: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const arrSlug = eval(req.body.arrSlug)
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            let listQuestion = await QuestionBank.find({ slug: { $in: arrSlug } })
                .populate({
                    path: 'questions',
                    populate: {
                        path: 'answers'
                    }
                })

            listQuestion = listQuestion.reduce((pre, element) => [...pre, ...element.questions], [])

            if (listQuestion) {
                // const result = listExam.map(item => {
                //     let { id, name } = item
                //     return { id, name, count: item.count }
                // })
                return res.status(200).json(listQuestion)
            }
            return res.status(400).json({
                message: "Không tìm thấy ngân hàng câu hỏi",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },
    addQuestionIntoQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { questionBankId, type, content, maxPoints, answers, image } = req.body

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi",
                })

            const question = new Question({
                type,
                content,
                maxPoints,
                answers: [],
                image
            })
            let error = question.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo ngân hàng câu hỏi thất bại!"
                })
            }

            await Promise.all(answers.map(async (element) => {
                const answer = new Answer({
                    content: element.content || "",
                    isCorrect: element.isCorrect || false
                })
                await answer.save()
                question.answers.push(answer.id)
            }))

            await (await question.save()).populate('answers')
            questionBank.questions.push(question.id)

            await questionBank.save()
            return res.status(200).json({
                message: "Thêm câu hỏi thành công",
                question
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi thêm câu hỏi" })
        }
    },
    UpdateQuestionInQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { questionBankId, questionId, type, content, maxPoints, answers, image } = req.body

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi",
                })
            const question = await Question.findOne({ _id: mongoose.Types.ObjectId(questionId) })
            if (!question) return res.status(400).json({ message: 'Không tồn tại câu hỏi' })
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
                answers: newAnswers,
                image
            }

            let updatedQuestion = await Question.findByIdAndUpdate({ '_id': new mongoose.Types.ObjectId(question.id) }, newData, { new: true }).populate('answers')
            return res.status(200).json({
                question: updatedQuestion
                //question: exitsQuestion
            })
        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi sửa câu hỏi!" })
        }

    },

    DeleteQuestionInQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { questionId, questionBankId } = req.query

            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const question = await Question.findById(questionId)

            if (!question) {
                return res.status(400).json({ message: "Câu hỏi không tồn tại" })
            }
            const user = await User.findOne({ username })

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi!",
                })

            if (questionBank.questions.find(item => item.toString() === question.id.toString())) {
                questionBank.questions = questionBank.questions.filter(item => item.toString() !== question.id.toString())
            }

            else {
                return res.status(400).json({ message: "Câu hỏi không nằm trong ngân hàng câu hỏi." })
            }
            await questionBank.save()
            return res.status(200).json({
                message: "Xoá câu hỏi thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi xoá câu hỏi!" })
        }
    },


    UpdateQuestionBank: async (req, res) => {//nhớ sửa
        try {
            const { name, description, userId } = req.body
            const newQuestionBank = await new QuestionBank({
                name,
                description,
                creatorId: userId
            });
            const questionBank = await newQuestionBank.save();

            return res.status(200).json({
                message: "Tạo ngân hàng câu hỏi thành công",
                slug: questionBank._doc.questionBankId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo ngân hàng câu hỏi" })
        }
    },

    DeleteQuestionBank: async (req, res) => {
        try {
            const { questionBankId } = req.query
            const username = req.user?.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const questionBank = await QuestionBank.findOne({ _id: mongoose.Types.ObjectId(questionBankId) })
            if (!questionBank) return res.status(400).json({ message: 'Không tồn tại ngân hàng câu hỏi' })

            const deleteQuestionBank = await questionBank.deleteOne({ _id: questionBankId })
            if (deleteQuestionBank) {
                return res.status(200).json({
                    message: "Xoá ngân hàng câu hỏi thành công!"
                })
            }
            return res.status(400).json({
                message: "Xoá ngân hàng câu hỏi không thành công!"
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xóa ngân hàng câu hỏi!" })
        }
    },
}

module.exports = { QuestionBankController }
