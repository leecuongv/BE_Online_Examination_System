const { Exam } = require("../models/Exam")
const mongoose = require("mongoose");
const ExamController = {
    CreateExam: async (req, res) => {///Sửa
        try {
            const { name, description, userId, slug } = req.body

            const newExam = await new Exam({
                name,
                description,
                creatorId : userId,
                slug,
            })
            let error = newExam.validateSync()
            if (error)
                return res.status(400).json({
                    message: "Tạo bài thi thất bại!"
                })
            const exam = await newExam.save();

            return res.status(200).json({
                message: "Tạo bài thi mới thành công",
                slug: exam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo bài thi" })
        }
    },
    getExamBySlug: async (req, res) => {//Sửa
        try {
            const { slug } = req.query
            console.log(slug)
            const exam = await Exam.findOne({ slug: slug })
            console.log(exam)
            if (exam) {
                const { name, description, questions, image, status } = exam._doc
                return res.status(200).json({ name, description, questions, image, status })
            }

            return res.status(400).json({
                message: "Không tìm thấy bài thi",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo bài thi" })
        }
    },
    //// 
    UpdateExam: async (req, res) => {//nhớ sửa
        try {
            const { slug, name, description, image, userId } = req.body

            const newExam = await new Exam({
                name,
                slug,
                description,
                email,
                image,
                creatorId: userId
            });


            let error = newExam.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo khoá học không thành công"
                })

            const exam = await newExam.save();

            return res.status(200).json({
                message: "Tạo khoá học thành công",
                slug: exam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },


}

module.exports = { ExamController }