const Lesson = require("../models/Lesson")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const { STATUS } = require("../utils/enum");
const SubmitLesson = require("../models/SubmitLesson")

const LessonController = {
    Create: async (req, res) => {
        try {
            const username = req.user.sub
            const { courseId, name, content, startTime, endTime, embeddedMedia,  status, file } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học" })



            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài giảng không hợp lệ" })

            }
            const newLesson = await new Lesson({
                courseId,
                name,
                content,
                creatorId: user.id,
                file,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                embeddedMedia,

            })
            let error = newLesson.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo bài giảng thất bại!"
                })
            }
            const Lesson = await newLesson.save();

            course.Lessons.push(Lesson.id);
            await course.save()

            return res.status(200).json({
                message: "Tạo bài giảng mới thành công",
                slug: Lesson._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },

    getLessonBySlug: async (req, res) => {
        try {
            const username = req.user.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const { slug } = req.query
            console.log(slug)
            const Lesson = await Lesson.findOne({ slug, creatorId: user.id })
            if (Lesson) {
                return res.status(200).json(Lesson._doc)
            }

            return res.status(400).json({
                message: "Không tìm thấy bài giảng",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi hiển thị bài giảng" })
        }
    },

    Update: async (req, res) => {
        try {
            const username = req.user.sub
            const { LessonId, courseId, name, content, startTime, endTime, embeddedMedia, status, file } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ" })

            const existLesson = await Lesson.findById(LessonId)
            if (!existLesson) return res.status(400).json({ message: "Không có bài giảng" })


            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài giảng không hợp lệ" })

            }


            let newData = {
                courseId,
                name,
                content,
                file,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                embeddedMedia

            }

            let updatedLesson = await Lesson.findByIdAndUpdate({ "_id": new mongoose.Types.ObjectId(LessonId) }, newData, { new: true })

            await course.save()

            return res.status(200).json({
                updatedLesson
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },

    Public: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })


            console.log(exitsLesson)
            exitsLesson = await Lesson.findByIdAndUpdate(id, {
                status: STATUS.PUBLIC
            }, { new: true })
            return res.status(200).json({
                message: "Xuất bản bài giảng thành công",

                slug: exitsLesson._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài giảng" })
        }
    },
    Close: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })

            console.log(exitsLesson)

            exitsLesson = await Lesson.findByIdAndUpdate(id, {
                status: STATUS.CLOSE
            }, { new: true })
            return res.status(200).json({
                message: "Đóng bài giảng thành công",

                slug: exitsLesson._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đóng bài giảng" })
        }
    },

    Delete: async (req, res) => {
        try {
            const username = req.user.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })

            let course = await Course.findById(exitsLesson.courseId)
            course.Lessons = course.Lessons.filter(item => item.toString() !== id)
            await course.save()
            console.log(exitsLesson)

            exitsLesson = await Lesson.deleteOne({ "_id": mongoose.Types.ObjectId(id) })
            
            await SubmitLesson.deleteMany({LessonId: id})

            return res.status(200).json({
                message: "Xóa bài giảng thành công",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài giảng" })
        }
    },
    getLessonByCourseOfTeacher: async (req, res) => {
        try {
            const username = req.user?.sub
            const courseId = req.query.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findOne({ courseId, creatorId: user.id })
                .populate({
                    path: 'Lessons'
                })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ" })
            console.log(course)


            if (course) {
                // const result = listExam.map(item => {
                return res.status(200).json(course._doc.Lessons)
            }
            return res.status(400).json({
                message: "Không tìm thấy bài giảng",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài giảng" })
        }
    },
    

};


module.exports = { LessonController }
