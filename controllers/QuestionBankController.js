const QuestionBank= require("../models/QuestionBank")
const User = require("../models/User")
const mongoose = require("mongoose")
const generator = require("generate-password")
const { ROLES, STATUS } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
const TakeExam = require("../models/TakeExam")
const QuestionBank = require("../models/QuestionBank")
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});
const QuestionBankController = {
    CreateQuestionBank: async (req, res) => {
        try {
            const { name,  description} = req.body
            const username = req.user.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const newQuestionBank = await new QuestionBank({
                name,
                description,
                creatorId: user.id,
                questions:[]
            });
            let error = newQuestionBank.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo khoá học không thành công"
                })

            const questionBank = await newQuestionBank.save();
            return res.status(200).json({
                message: "Tạo khoá học thành công",
                questionBankId: questionBank._doc.questionBankId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    getQuestionBankBySlug: async (req, res) => {
        try {
            const { slug } = req.query
            console.log(slug)
            const questionBank = await CQuestionBankfindOne({ slug: slug })
            console.log(questionBank)
            if (questionBank) {
                const { name, description, questions, image, status } = questionBank._doc
                return res.status(200).json({ name, description, exams, image, status })
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    getListQuestionOfQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const questionBankId = req.query.questionBankId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            console.log(questionBankId)

            const listQuestion = await QuestionBank.aggregate([
                {
                    $match: { questionBankId: Number(questionBankId) }
                },
                {
                    $lookup:
                    {
                        from: "questions",
                        localField: "questions",
                        foreignField: "_id",
                        as: "questions"
                    }
                },
                {
                    $unwind: {
                        path: "$questions",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "take_questions",
                        localField: "questions._id",
                        foreignField: "exam",
                        as: "takeExams"
                    }
                },
                {
                    $unwind: {
                        path: "$takeExams",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$questions._id', "doc": { "$first": "$$ROOT.questions" }
                        , count: {
                            $sum: {
                                $cond: [{ $ifNull: ['$takeExams', false] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        id: "$doc._id",
                        name: "$doc.name",
                        count: "$count",
                        slug: "$doc.slug",
                        status:'$doc.status',
                        numberofQuestions:"$doc.numberofQuestions",
                    startTime:'$doc.startTime',
                    endTime:'$doc.endTime',
                    maxTimes:'$doc.maxTimes'
                    }
                }
            ]
            )
            console.log(listExam)

            if (listExam) {
                // const result = listExam.map(item => {
                //     let { id, name } = item
                //     return { id, name, count: item.count }
                // })
                return res.status(200).json(listExam)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    addQuestionIntoQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { questionId, questionBankId } = req.body
            console.log(new mongoose.Types.ObjectId(questionBankId));

            const user = await User.findOne({ username })
            
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const question = await Question.findById(questionId)
            if(!question){
                return res.status(400).json({ message: "Câu hỏi không tồn tại" })
            }

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi",
                })

            if (!questionBank.questions.find(item => item.toString() === question.id.toString())) {//nếu chưa có sinh viên trên
                questionBank.questions.push(question.id)
            }
            else {
                return res.status(400).json({ message: "Câu hỏi đã có sẵn trong ngân hàng câu hỏi." })
            }
            await questionBank.save()
            return res.status(200).json({
                message: "Thêm câu hỏi thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi thêm câu hỏi" })
        }
    },

    deleteStudentInQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { questionId, questionBankId } = req.query
            
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const question = await Question.findById(questionId)
            
            if(!question){
                return res.status(400).json({ message: "Câu hỏi không tồn tại" })
            }
            const user = await User.findOne({ username })

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi!",
                })

            if (questionBank.questions.find(item => item.toString() === question.id.toString())) {//nếu chưa có sinh viên trên
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
            res.status(500).json({ message: "Lỗi thêm câu hỏi!" })
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


            let error = newQuestionBank.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo khoá học không thành công. Vui lòng thử lại!"
                })
            const questionBank = await newQuestionBank.save();

            return res.status(200).json({
                message: "Tạo khoá học thành công",
                slug: questionBank._doc.questionBankId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
}

module.exports = { QuestionBankController }
