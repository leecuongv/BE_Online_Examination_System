const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")

const ExamController = {
    CreateExam: async (req, res) => {
        try 
        {
                const username = req.user.sub
                const { name, description, courseId, numberOfQuestion, viewPoint, viewAnswer, 
                    attemptsAllowed, maxPoints, typeofPoint, maxTimes, tracking, shuffle, status, startTime, endTime} = req.body
                if (!username) return res.status(400).json({ message: "Không có người dùng" })
                const user = await User.findOne({ username })
                if (!user) return res.status(400).json({ message: "Không có người dùng" })

                const course = await Course.findOne({_id:mongoose.Types.ObjectId(courseId), creatorId:user.id})
                if(!course) return res.status(400).json({message:"Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học"})


                if (startTime === null || endTime === null
                    || new Date(startTime).toLocaleString() === "Invalid Date"
                    || new Date(endTime).toLocaleString() === "Invalid Date") {
                    return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })
                
        }
            
            const newExam = await new Exam({
                
                name, 
                description, 
                creatorId: user.id,  
                numberOfQuestion, 
                viewPoint, 
                viewAnswer, 
                attemptsAllowed, 
                maxPoints, 
                typeofPoint, 
                maxTimes, 
                tracking, 
                shuffle, 
                status,
                startTime:new Date(startTime),
                endTime: new Date(endTime)
            })
            let error = newExam.validateSync()
            if (error){
                console.log(error)
                return res.status(400).json({
                    message: "Tạo bài thi thất bại!"
                })
            }
            const exam = await newExam.save();
            
            course.exams.push(exam.id);
            await course.save()

            return res.status(200).json({
                message: "Tạo bài thi mới thành công",
                slug: exam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },
    getExamBySlug: async (req, res) => {
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
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },
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
            res.status(400).json({ message: "Lỗi tạo khoá học" })
        }
    },


}

module.exports = { ExamController }