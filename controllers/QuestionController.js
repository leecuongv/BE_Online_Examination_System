/// Tạo câu hỏi 
// - Tạo 1 câu
// - Tạo bằng file
// - Sửa câu hỏi (có đáp án mới thì thêm vào, có gửi kèm id)

const Question = require("../models/Question")
const mongoose = require("mongoose")
const User = require("../models/User")
const Exam = require("../models/Exam")
const Answer = require("../models/Answer")
const Exam = require("../models/Exam")

const QuestionController = {
    CreateQuestion: async (req, res) => {
        try {
            const username = req.user.sub
            const { examId, type, content, maxPoint, answers, image } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng!" })
            const user = await User.findOne({ username })
            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam) return res.status(400).json({ message: "Không tồn tại!" })
            if (!user) return res.status(400).json({ message: "Không có người dùng!" })

            const newQuestion = await new Question({

                type,
                content,
                maxPoint,
                answers:[],
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
                const answer = await new Answer({
                    content: element.content || "",
                    isCorrect: element.isCorrect || false
                })
                await answer.save()
                newQuestion.answers.push(answer.id)
            }))

            await newQuestion.save()
            exam.questions.push({question: newQuestion.id})

            await exam.save()
            
            return res.status(200).json({
                message: "Tạo câu hỏi mới thành công!",
                question: newQuestion._doc
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo câu hỏi!" })
        }
    }
}

