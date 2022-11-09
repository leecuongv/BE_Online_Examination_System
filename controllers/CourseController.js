const Course = require("../models/Course")
const User = require("../models/User")
const mongoose = require("mongoose")
const generator = require("generate-password")
const { ROLES, STATUS } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
const TakeExam = require("../models/TakeExam")
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
                if (image.data.size > 2000000) {
                    return res.status(400).json({ message: "Ảnh có kích thước quá 2Mb" })
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
                const { _id, courseId, name, description, exams, image, status,startTime,endTime } = course._doc
                return res.status(200).json({ id: _id, courseId, name, description, exams, image, status,startTime,endTime })
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
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const courses = await Course.find({ creatorId: user.id })
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
            //Lấy cái parameter
            const username = req.user?.sub
            const search = req.query.search
            const courseId = req.query.courseId

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findById(courseId)
            let students = course.students
            students.push(user.id)
            console.log(students)
            const users = await User.find({ $text: { $search: search }, _id: { $nin: students } })
                .select({ id: 1, fullname: 1, gender: 1, avatar: 1, birthday: 1 })
                .limit(20)
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
    getListStudentOfCourse: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findOne({ courseId })
                .populate({ path: 'students', select: { id: 1, fullname: 1, avatar: 1, email: 1 } })

            let listStudent = course.students
            let listExam = course.exams
            const countExam = await TakeExam.aggregate([
                {
                    $match:
                    {
                        userId: { $in: listStudent },
                        examId: { $in: listExam }
                    }
                },
                {
                    $group: { _id: { 'examId': '$examId', 'userId': '$userId' } }
                },
                {
                    $group: { _id: '$_id.userId', count: { $sum: 1 } }
                }
            ])

            let result = listStudent.map(std => {
                let tmp = countExam?.find(item => item._id.toString() === std.id.toString())
                let count = 0
                if (tmp) {
                    count = tmp.count
                }

                return { ...std._doc, count }
            })
            console.log(new Date().getTime() - start)

            if (course) {
                return res.status(200).json(result)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    getListExamOfCourse: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            console.log(courseId)

            const listExam = await Course.aggregate([
                {
                    $match: { courseId: Number(courseId) }
                },
                {
                    $lookup:
                    {
                        from: "exams",
                        localField: "exams",
                        foreignField: "_id",
                        as: "exams"
                    }
                },
                {
                    $unwind: {
                        path: "$exams",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "take_exams",
                        localField: "exams._id",
                        foreignField: "examId",
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
                        _id: '$exams._id', "doc": { "$first": "$$ROOT.exams" }
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
                        status: '$doc.status',
                        numberofQuestions: "$doc.numberofQuestions",
                        startTime: '$doc.startTime',
                        endTime: '$doc.endTime',
                        maxTimes: '$doc.maxTimes'
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
    addStudentIntoCourse: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { studentId, courseId } = req.body
            console.log(new mongoose.Types.ObjectId(courseId));

            const teacher = await User.findOne({ username })
            const student = await User.findById(studentId)
            if (!teacher || !student) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            let course = await Course.findOne({ _id: new mongoose.Types.ObjectId(courseId), creatorId: teacher.id })
            if (!course)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })

            if (!course.students.find(item => item.toString() === student.id.toString())) {//nếu chưa có sinh viên trên
                course.students.push(student.id)
            }
            else {
                return res.status(400).json({ message: "Học viên đã thuộc lớp học." })
            }
            await course.save()
            return res.status(200).json({
                message: "Thêm học viên thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi thêm học viên" })
        }
    },

    deleteStudentInCourse: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { studentId, courseId } = req.query

            const teacher = await User.findOne({ username })
            const student = await User.findById(studentId)
            if (!teacher || !student) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            let course = await Course.findOne({ _id: new mongoose.Types.ObjectId(courseId), creatorId: teacher.id })
            if (!course)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })

            if (course.students.find(item => item.toString() === student.id.toString())) {//nếu chưa có sinh viên trên
                course.students = course.students.filter(item => item.toString() !== student.id.toString())
            }
            else {
                return res.status(400).json({ message: "Học viên không thuộc lớp học." })
            }
            await course.save()
            return res.status(200).json({
                message: "Xoá học viên thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi thêm học viên" })
        }
    },


    UpdateCourse: async (req, res) => {//nhớ sửa
        try {
            const username = req.user?.sub
            const { slug, name, description, startTime, endTime, courseId } = req.body
            const image = req.files?.file
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })
            }
            const course = await Course.findOne({ courseId })
            
            let data = {//dữ liệu cần update
                slug, name, description, startTime, endTime
            }

            if (image) {
                if (image.data.size > 2000000) {
                    return res.status(400).json({ message: "Ảnh có kích thước quá 2Mb" })
                }
                let dataImage = image.data.toString('base64')
                dataImage = `data:${image.mimetype};base64,${dataImage}`//chuyển sang data uri
                try {
                    const upload = await cloudinary.uploader
                        .upload(dataImage,
                            {
                                folder: "course/",
                                public_id: course.id.toString(),
                                overwrite:true
                            })
                        data.image = upload.secure_url
                }
                catch (err) {
                    console.log(err);
                }
                
            }

            await Course.updateOne({courseId},data);
            return res.status(200).json({
                message: "Cập nhật khoá học thành công",
                courseId: course._doc.courseId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },
    getCourseFromStudent: async (req, res) => {

    },
    getListExamInCourseOfStudent: async (req, res) => {

    }
}

module.exports = { CourseController }
