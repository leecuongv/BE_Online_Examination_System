const bcrypt = require("bcrypt")
const { Course } = require("../models/Course")
const { User } = require("../models/User")
const mongoose = require("mongoose")
const generator = require("generate-password")
const { ROLES, STATUS } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});
const CourseController = {
    CreateCourse: async (req, res) => {
        try {
            const { slug, name, description, username, startTime, endTime } = req.body
            const image = req.files?.file
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })
            }

            const newCourse = await new Course({
                name,
                slug,
                description,
                image,
                creatorId: user.id,
                startTime,
                endTime
            });
            if (image) {
                if(image.data.size > 2000000){
                    return res.status(400).json({message:"Ảnh có kích thước quá 2Mb"})
                }
                let data = image.data.toString('base64')
                data = `data:${image.mimetype};base64,${data}`//chuyển sang data uri
                try {
                    const upload = await cloudinary.uploader
                        .upload(data,
                            {
                                folder: "course/",
                                public_id: newCourse.id.toString()
                            })
                    newCourse.image = upload.secure_url
                }
                catch (err) {
                    console.log(err);
                }
            }

            let error = newCourse.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo khoá học không thành công"
                })

            const course = await newCourse.save();
            return res.status(200).json({
                message: "Tạo khoá học thành công",
                courseId: course._doc.courseId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    getCourseBySlug: async (req, res) => {
        try {
            const { slug } = req.query
            console.log(slug)
            const course = await Course.findOne({ slug: slug })
            console.log(course)
            if (course) {
                const { name, description, exams, image, status } = course._doc
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
    getCourseByCourseId: async (req, res) => {
        try {
            const { courseId } = req.query
            const username = req.user?.sub
            //const user = await User.findOne({username})

            const course = await Course.findOne({ courseId })
            if (course) {
                const { name, description, exams, image, status } = course._doc
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
    getListCourseTeacher: async (req, res) => {
        try {
            const username = req.user?.sub
            const user = await User.findOne({username})
            if(!user){
                return res.status(400).json({message:"Tài khoản không tồn tại"})
            }
            const courses = await Course.find({ creatorId:user.id })
            if (courses) {
                return res.status(200).json(courses)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    searchListStudentToAdd: async (req, res) => {
        try {
            const username = req.user?.sub
            const search = req.query.search
            
            console.log(req.params)
            const user = await User.findOne({username})
            if(!user){
                return res.status(400).json({message:"Tài khoản không tồn tại"})
            }
            const users = await User.find({$text: {$search: search} })
            if (users) {
                return res.status(200).json(users)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },



    UpdateCourse: async (req, res) => {//nhớ sửa
        try {
            const { slug, name, description, image, userId } = req.body
            const newCourse = await new Course({
                name,
                slug,
                description,
                email,
                creatorId: userId
            });


            let error = newCourse.validateSync();
            if (error)
                return res.status(400).json({
                    message: "Tạo khoá học không thành công. Vui lòng thử lại!"
                })
            const course = await newCourse.save();

            return res.status(200).json({
                message: "Tạo khoá học thành công",
                slug: course._doc.courseId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
}

module.exports = { CourseController }
