const Lesson = require("../models/Lesson")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const { STATUS } = require("../utils/enum");
const SeenLesson = require("../models/SeenLesson");
const { CompareDate, IsClose, IsOpen } = require("./handler/DateTimeHandler")

const LessonController = {
    Create: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId, name, content, startTime, endTime, embeddedMedia, status, file } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học" })



            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài giảng không hợp lệ!" })

            }
            if (CompareDate(startTime, course.startTime) === -1 || CompareDate(endTime, course.endTime) === 1) {
                return res.status(400).json({ message: "Thời gian của bài giảng phải nằm trong thời gian khoá học diễn ra!" })

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
            const lesson = await newLesson.save();

            course.lessons.push(lesson.id);
            await course.save()

            return res.status(200).json({
                message: "Tạo bài giảng mới thành công",
                slug: lesson._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },

    getLessonBySlug: async (req, res) => {
        try {
            const username = req.user?.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const { slug } = req.query
            const lesson = await Lesson.findOne({ slug, creatorId: user.id })
            if (lesson) {
                return res.status(200).json(lesson._doc)
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
            const username = req.user?.sub
            const { lessonId, courseId, name, content, startTime, endTime, embeddedMedia, status, file } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ" })

            const existLesson = await Lesson.findById(lessonId)
            if (!existLesson) return res.status(400).json({ message: "Không có bài giảng" })


            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của bài giảng không hợp lệ" })

            }
            if (CompareDate(startTime, course.startTime) === -1 || CompareDate(endTime, course.endTime) === 1) {
                return res.status(400).json({ message: "Thời gian của bài giảng phải nằm trong thời gian khoá học diễn ra" })

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

            let updatedLesson = await Lesson.findByIdAndUpdate({ "_id": new mongoose.Types.ObjectId(lessonId) }, newData, { new: true })

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
            const username = req.user?.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })

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
            const username = req.user?.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })


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
            const username = req.user?.sub
            const id = req.query.id

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            let exitsLesson = await Lesson.findById(id)
            if (!exitsLesson) return res.status(400).json({ message: "Không có bài giảng" })

            let course = await Course.findById(exitsLesson.courseId)
            course.lessons = course.lessons.filter(item => item.toString() !== id)
            await course.save()

            await Lesson.deleteOne({ "_id": mongoose.Types.ObjectId(id) })


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
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findOne({ courseId, creatorId: user.id })
                .populate({
                    path: 'lessons'
                })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ" })


            if (course) {
                // const result = listExam.map(item => {
                return res.status(200).json(course._doc.lessons)
            }
            return res.status(400).json({
                message: "Không tìm thấy bài giảng",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài giảng" })
        }
    },
    getLessonByCourseOfStudent: async (req, res) => {
        try {
            const username = req.user?.sub
            const courseId = req.query.courseId
            const user = await User.findOne({ username })

            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const course = await Course.aggregate([
                {
                    $match: {
                        courseId: Number(courseId),
                        students: { $in: [user._id] },

                    }
                },
                {
                    $lookup: {
                        from: 'lessons',
                        let: { 'lessonIds': '$lessons', lessonId: '$lessonId' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $in: ['$_id', '$$lessonIds'] },
                                            { $eq: ['$status', STATUS.PUBLIC] },
                                            { $lt: ["$startTime", new Date()] },
                                            { $gte: ["$endTime", new Date()] }

                                        ]

                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: 'seen_lessons',
                                    let: { 'lessonId': '$_id' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ['$lessonId', '$$lessonId'] },
                                                        { $eq: ['$creatorId', user._id] }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    as: 'seen'
                                }
                            },
                            {
                                $set: {
                                    seen: { $ne: ['$seen', []] }
                                }
                            }
                        ],
                        as: 'lessons'
                    }
                }
            ])

            if (course.length === 0) return res.status(400).json({ message: "Thông tin không hợp lệ" })

            // const result = listExam.map(item => {            
            return res.status(200).json(course[0].lessons)


        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm bài giảng" })
        }
    },

    SeenLesson: async (req, res) => {
        try {
            const username = req.user?.sub
            const { lessonId } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const existLesson = await Lesson.findById(lessonId)
            if (!existLesson) return res.status(400).json({ message: "Không có bài giảng" })

            let newData = new SeenLesson({
                lessonId: existLesson.id,
                creatorId: user.id
            })

            await newData.save()

            return res.status(200).json({
                message: 'Thành công'
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },
    UnseenLesson: async (req, res) => {
        try {
            const username = req.user?.sub
            const { lessonId } = req.query
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const existLesson = await Lesson.findById(lessonId)
            if (!existLesson) return res.status(400).json({ message: "Không có bài giảng" })

            await SeenLesson.findOneAndDelete({
                lessonId: existLesson.id,
                creatorId: user.id
            })

            return res.status(200).json({
                message: 'Thành công'
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },
    UnseenLesson2: async (req, res) => {
        try {
            const username = req.user?.sub
            const { lessonId } = req.body
            if (!username) return res.status(400).json({ message: "Không có người dùng" })

            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const existLesson = await Lesson.findById(lessonId)
            if (!existLesson) return res.status(400).json({ message: "Không có bài giảng" })

            await SeenLesson.aggregate([
                {
                    $match: { students: { $in: [ObjectId('63428c02cd5e93a197c4d92f')] } }
                },
                {
                    $facet: {
                        'temp': [
                            {
                                $lookup: {
                                    from: "take_exams",
                                    let: { examId: "$examId" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", ObjectId('63428c02cd5e93a197c4d92f')] },
                                                            { $eq: ["$exams", "$$examId"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$examId" } },
                                    ],
                                    as: "takeExams"
                                }
                            },
                            {
                                $lookup: {
                                    from: "submit_assignments",
                                    let: { assignmentId: "$assignmentId" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", ObjectId('63428c02cd5e93a197c4d92f')] },
                                                            { $eq: ["$assignments", "$$assignmentId"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$assignmentId" } },
                                    ],
                                    as: "assigns"
                                }
                            },
                            {
                                $lookup: {
                                    from: "seen_lessons",
                                    let: { lessonId: "$lessonId" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", ObjectId('63428c02cd5e93a197c4d92f')] },
                                                            { $eq: ["$lessons", "$$lessonId"] }
                                                        ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, countId: "$lessonId" } },
                                    ],
                                    as: "seenLessons"
                                }
                            },
                            {
                                $project: {
                                    'counts': { $concatArrays: ['$assigns', '$takeExams', '$seenLessons'] }
                                }
                            },
                            {
                                $unwind: {
                                    path: "$counts",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $group: {
                                    _id: '$counts.countId', "doc": { "$first": "$_id" }
                                }
                            },
                            {
                                $group: {
                                    _id: '$doc', count: { $sum: 1 }
                                }
                            }


                        ],
                        'main': [
                            {
                                $project: {
                                    'counts': { $concatArrays: ['$exams', '$assignments', { $ifNull: ['$lessons', []] }] }
                                }
                            },
                            {
                                $unwind: {
                                    path: '$counts',
                                }
                            },
                            {
                                $group: {
                                    _id: '$_id',
                                    total: { $sum: 1 }
                                }
                            },

                        ]
                    }
                },
                {
                    $project: {
                        all: {
                            $concatArrays: ["$temp", "$main"]
                        }
                    }
                },
                {
                    $unwind: "$all"
                },
                {
                    $group: {
                        _id: "$all._id",
                        count: { $sum: "$all.count" },
                        total: { $sum: "$all.total" },

                    }
                },
                {
                    $project: {
                        _id: 0,
                        group: "$_id",
                        count: 1,
                        total: 1,
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] }
                    }
                }

            ])

            return res.status(200).json({
                message: 'Thành công'
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài giảng" })
        }
    },

    getCalendarOfStudent: async (req, res) => {
        try {
            const timeZone = -420 * 60000
            const username = req.user?.sub
            //const courseId = req.query.courseId
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const courses = await Course.find({ students: { $in: [user.id] } })
                .populate({
                    path: 'lessons'
                })
                .populate({
                    path: 'exams',
                    select: 'name startTime endTime _id slug'
                })
                .populate({
                    path: 'assignments',
                    select: 'name startTime endTime _id slug'
                })
            if (!courses) return res.status(400).json({ message: "Thông tin không hợp lệ" })

            if (courses) {
                let calendar = {}
                courses.forEach(course => {
                    course.exams?.forEach(exam => {
                        let dateMark = new Date(exam.startTime - timeZone).toISOString().substring(0, 10)
                        if (!calendar[dateMark])
                            calendar[dateMark] = []
                        calendar[dateMark].push({ nameCourse: course.name, courseId: course.courseId, type: 'exam', ...exam._doc })

                        dateMark = new Date(exam.endTime - timeZone).toISOString().substring(0, 10)
                        if (!calendar[dateMark])
                            calendar[dateMark] = []
                        calendar[dateMark].push({ nameCourse: course.name, courseId: course.courseId, type: 'exam', ...exam._doc })
                    })

                    course.assignments?.forEach(assignment => {
                        let dateMark = new Date(assignment.startTime - timeZone).toISOString().substring(0, 10)
                        if (!calendar[dateMark])
                            calendar[dateMark] = []
                        calendar[dateMark].push({ nameCourse: course.name, courseId: course.courseId, type: 'assignment', ...assignment._doc })

                        dateMark = new Date(assignment.endTime - timeZone).toISOString().substring(0, 10)
                        if (!calendar[dateMark])
                            calendar[dateMark] = []
                        calendar[dateMark].push({ nameCourse: course.name, courseId: course.courseId, type: 'assignment', ...assignment._doc })
                    })
                })
                calendar = Object.keys(calendar).sort().reduce(
                    (obj, key) => {
                        obj[key] = calendar[key];
                        return obj;
                    },
                    {}
                );

                let result =
                    Object.keys(calendar).map((key, index) => {
                        return {
                            index,
                            date: key,
                            activities: calendar[key]
                        }
                    })
                // const result = listExam.map(item => {
                return res.status(200).json(result)
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
