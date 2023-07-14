const Course = require("../models/Course")
const User = require("../models/User")
const mongoose = require("mongoose")
const { ROLES, STATUS, CERTIFICATION } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
const TakeExam = require("../models/TakeExam")
const Exam = require("../models/Exam")
const Assignment = require("../models/Assignment")
const Lesson = require("../models/Lesson")
const Question = require("../models/Question")
const Answer = require("../models/Answer")


const jwt = require("jsonwebtoken");


dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});
const CourseController = {
    CreateCourse: async (req, res) => {
        try {
            let isSell = false
            const { slug, name, description, username, startTime, endTime, price, pin, certification } = req.body
            const image = req.files?.file
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })
            }
            if (price < 0)
                return res.status(400).json({ message: "Giá tiền của khoá học phải lớn hơn hoặc bằng 0!" })
            if (price > 0)
                isSell = true

            const newCourse = await new Course({
                name,
                slug,
                description,
                image,
                creatorId: user.id,
                startTime,
                endTime,
                price,
                isSell,
                pin,
                certification
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

            const course = await Course.findOne({ slug: slug, status: STATUS.PUBLIC })

            if (course) {
                const { name, description, exams, lessons, assignments, image } = course._doc
                return res.status(200).json({ name, description, exams, lessons, assignments, image })
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học!",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },

    GetCourseInfoByCourseId: async (req, res) => {
        try {
            const { courseId } = req.query
            const course = await Course.aggregate([
                { $match: { courseId: Number(courseId) } },
                {
                    $project: {
                        name: 1,
                        description: 1,
                        image: 1,
                        status: 1,
                        startTime: 1,
                        endTime: 1,
                        creatorId: 1,
                        certification: 1,
                        numberOfExams: { $cond: { if: { $isArray: "$exams" }, then: { $size: "$exams" }, else: "NA" } },
                        numberOfAssignments: { $cond: { if: { $isArray: "$assignments" }, then: { $size: "$assignments" }, else: "NA" } },
                        numberOfLessons: { $cond: { if: { $isArray: "$lessons" }, then: { $size: "$lessons" }, else: "NA" } },
                        numberOfStudents: { $cond: { if: { $isArray: "$students" }, then: { $size: "$students" }, else: "NA" } },
                    }
                }
            ])

            if (course) {
                return res.status(200).json(course)
                //return res.status(200).json(course._doc)
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },

    getCourseInfoToEnroll: async (req, res) => {
        try {
            const { courseId } = req.query
            const username = req.user?.sub

            const course = await Course.findOne({ courseId: Number(courseId) })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: 'Không tồn tại tài khoản' })
            if (course) {
                if (course.students.find(item => item.toString() === user.id.toString())) {
                    return res.status(400).json({
                        message: 'Bạn đã tham gia khoá học'
                    })
                }
                if (course.status === 'private')
                    return res.status(400).json({
                        message: 'Không tìm thấy khoá học'
                    })
                const { name, } = course._doc
                return res.status(200).json({ name })
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi lấy thông tin khoá học" })
        }
    },

    getCourseByCourseId: async (req, res) => {
        try {
            const { courseId } = req.query
            const username = req.user?.sub
            const student = await User.findOne({ username })
            const course = await Course.aggregate([
                {
                    $match:

                        { courseId: Number(courseId) }

                },
                {
                    $facet: {
                        'temp': [
                            {
                                $lookup: {
                                    from: "take_exams",
                                    let: { examIds: "$exams" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$examId", "$$examIds"] },
                                                            { $eq: ["$isPass", true] }
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
                                    let: { assignmentIds: "$assignments" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$assignmentId", "$$assignmentIds"] },
                                                            { $eq: ["$isPass", true] }
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
                                    let: { lessonIds: "$lessons" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$lessonId", "$$lessonIds"] }
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
                                    //preserveNullAndEmptyArrays: true
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
                                // $match: { students: { $in: [mongoose.Types.ObjectId(student.id)] } }
                                $match: { courseId: Number(courseId) }
                            },
                            {
                                $project: {
                                    'doc': '$$ROOT',
                                    'total': {
                                        $size:
                                        {
                                            $concatArrays: [
                                                '$exams', { $ifNull: ['$assignments', []] }, { $ifNull: ['$lessons', []] }]
                                        }
                                    }
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
                        doc: { '$last': '$all.doc' },
                        count: { $sum: "$all.count" },
                        total: { $sum: "$all.total" },

                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: '$doc.name',
                        image: '$doc.image',
                        courseId: "$doc.courseId",
                        exams: '$doc.exams',
                        assignments: "$doc.assignments",
                        lessons: "$doc.lessons",
                        students: '$doc.students',
                        description: '$doc.description',
                        count: 1,
                        total: 1,
                        certification: '$doc.certification',
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] }
                    }
                }

            ]);
            if (course.length > 0) {
                if (!course[0].students.find(e => e.toString() === student.id.toString()))
                    return res.status(400).json({
                        message: "Học viên Không thuộc khoá học!",
                    })

                const { _id, courseId, name, description, exams, assignments, lessons, image, status, startTime, endTime, avg, certification } = course[0]

                // TODO: điều kiện cấp chứng chỉ 
                let isQualified = true
                if (certification === CERTIFICATION.NOTALLOW)
                    isQualified = false
                if (certification === CERTIFICATION.WHENDONE && avg < 0.8)
                    isQualified = false
                if (certification === CERTIFICATION.WHENCOURSEDONE)
                    if ((new Date(endTime)) > (new Date()) || avg < 0.8)
                        isQualified = false

                return res.status(200).json({ id: _id, courseId, name, description, exams, assignments, lessons, image, status, startTime, endTime, avg, certification, isQualified })
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tìm khoá học" })
        }
    },

    getCourseByCourseIdOfTeacher: async (req, res) => {
        try {
            const { courseId } = req.query
            const username = req.user?.sub
            const student = await User.findOne({ username })
            if (!student) {
                return res.status(400).json({ message: "Không tìm thấy người dùng!" })
            }
            const course = await Course.findOne({ courseId: Number(courseId), creatorId: student.id });
            if (course) {
                const { _id, courseId, name, description, exams, lessons, assignments, image, status, startTime, endTime, price, avg, certification, pin } = course._doc
                return res.status(200).json({ id: _id, courseId, name, description, exams, lessons, assignments, image, status, startTime, endTime, price, avg, certification, pin })
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
            const username = req.user?.sub
            //const search = req.query.search
            const courseId = req.query.courseId

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findById(courseId)
            if (!course)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })
            let students = course.students
            students.push(user.id)

            // const users = await User.find({ $text: { $search: search }, _id: { $nin: students }, role: { $ne: ROLES.ADMIN } })
            //     .select({ id: 1, fullname: 1, gender: 1, avatar: 1, birthday: 1 })
            //     .limit(20)

            const search = req.query.search
                ? {
                    $or: [
                        { username: { $regex: req.query.search, $options: "i" } },
                        { fullname: { $regex: req.query.search, $options: "i" } },
                        { email: { $regex: req.query.search, $options: "i" } },
                    ],
                }
                : {};
            const users = await User.find(search).find({ _id: { $nin: students }, role: { $ne: ROLES.ADMIN } })
                .select({ id: 1, fullname: 1, email: 1, gender: 1, avatar: 1, birthday: 1 })
                .limit(20);

            if (!users) {
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })

            }
            let listUsers = users.map(item => {
                let fullname = item.fullname + ": " + item.email
                delete item.email
                delete item.fullname
                return { id: item.id, fullname, gender: item.gender, avatar: item.avatar, birthday: item.birthday }
            })
            return res.status(200).json(listUsers)

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },

    getListStudentOfCourse: async (req, res) => {
        try {
            const username = req.user?.sub
            const courseId = req.query?.courseId
            const start = new Date().getTime()
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            const course = await Course.findOne({ courseId: Number(courseId) })
                .populate({ path: 'students', select: { id: 1, fullname: 1, avatar: 1, email: 1, gender: 1 } })
            if (!course)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })
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
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }


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
                { $match: { _id: { $ne: null } } },
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


            if (listExam) {
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
            const username = req.user?.sub
            const { studentId, courseId } = req.body


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
            if (course.isSell === true) {
                return res.status(400).json({
                    message: "Không thể xoá sinh viên đã mua khoá học!",
                })
            }
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


    UpdateCourse: async (req, res) => {
        try {
            let isSell = false
            const username = req.user?.sub
            const { slug, name, description, startTime, endTime, courseId, price, certification, pin, status, toPass } = req.body
            const image = req.files?.file
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })
            }
            const course = await Course.findOne({ courseId: Number(courseId) })

            if (price < 0)
                return res.status(400).json({ message: "Giá tiền của khoá học phải lớn hơn hoặc bằng 0!" })
            if (price > 0)
                isSell = true
            let data = {
                slug,
                name,
                description,
                startTime,
                endTime,
                price,
                isSell,
                certification,
                pin,
                status,
                toPass
            }

            if (image) {
                if (image.data.size > 2000000) {
                    return res.status(400).json({ message: "Ảnh có kích thước quá 2Mb" })
                }
                let dataImage = image.data.toString('base64')
                dataImage = `data:${image.mimetype};base64,${dataImage}`
                try {
                    const upload = await cloudinary.uploader
                        .upload(dataImage,
                            {
                                folder: "course/",
                                public_id: course.id.toString(),
                                overwrite: true
                            })
                    data.image = upload.secure_url
                }
                catch (err) {
                    console.log(err);
                }

            }

            await Course.updateOne({ courseId: Number(courseId) }, data, { new: true });
            return res.status(200).json({
                message: "Cập nhật khoá học thành công",
                courseId: course._doc.courseId
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },

    getStudentCourse: async (req, res) => {
        try {

            const username = req.user?.sub
            const student = await User.findOne({ username })
            if (!student) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            let studentCourse = await Course.aggregate([
                {
                    $match: { students: { $in: [mongoose.Types.ObjectId(student.id)] } }
                },
                {
                    $facet: {
                        'temp': [
                            {
                                $lookup: {
                                    from: "take_exams",
                                    let: { examIds: "$exams" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$examId", "$$examIds"] },
                                                            { $eq: ["$isPass", true] }
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
                                    let: { assignmentIds: "$assignments" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$assignmentId", { $ifNull: ["$$assignmentIds", []] }] },
                                                            { $eq: ["$isPass", true] }
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
                                    let: { lessonIds: "$lessons" },
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$creatorId", mongoose.Types.ObjectId(student.id)] },
                                                            { $in: ["$lessonId", { $ifNull: ["$$lessonIds", []] }] }
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
                                $match: { students: { $in: [mongoose.Types.ObjectId(student.id)] } }
                            },
                            {
                                $project: {
                                    'doc': '$$ROOT',
                                    'total': {
                                        $size:
                                        {
                                            $concatArrays: [
                                                '$exams', { $ifNull: ['$assignments', []] }, { $ifNull: ['$lessons', []] }]
                                        }
                                    }
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
                        doc: { '$last': '$all.doc' },
                        count: { $sum: "$all.count" },
                        total: { $sum: "$all.total" },

                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: '$doc.name',
                        image: '$doc.image',
                        courseId: "$doc.courseId",
                        count: 1,
                        total: 1,
                        certification: "$doc.certification",
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] },
                        startTime: "$doc.startTime",
                        endTime: "$doc.endTime"
                    }
                }

            ]);

            if (!studentCourse)
                return res.status(400).json({ message: "Học viên chưa thuộc khóa học nào." })

            return res.status(200).json(studentCourse)

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi thêm học viên" })
        }
    },

    getListExamInCourseOfStudent: async (req, res) => {
        try {
            const username = req.user?.sub
            const courseId = req.query.courseId
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }


            let listCourse = await Course.aggregate([
                {
                    $match: { courseId: Number(courseId) }
                },
                {
                    $lookup:
                    {
                        from: "exams",
                        localField: "exams",
                        foreignField: "_id",
                        "pipeline": [
                            {
                                "$lookup": {
                                    "from": "take_exams",
                                    localField: "_id",
                                    foreignField: "examId",
                                    "pipeline": [
                                        {
                                            "$match": {
                                                "userId": user._id
                                            }
                                        }
                                    ],
                                    "as": "takeExams"
                                }
                            }
                        ],
                        as: "exams"
                    }
                },
            ])

            if (listCourse.length === 0)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })
            let listExam = listCourse[0].exams

            listExam = listExam.filter(item => item.status !== STATUS.PRIVATE)
            listExam = listExam.map(item => {
                let count = item.takeExams.length
                delete item.takeExams
                delete item.questions
                return { ...item, count }
            })
            return res.status(200).json(listExam)


        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi lấy danh sách đề thi" })
        }
    },

    enrollInCourse: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId, pin } = req.body

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }
            const course = await Course.findOne({ courseId: Number(courseId) })
            if (!course)
                return res.status(400).json({ message: "Không tồn tại khóa học!" })

            if (pin !== course.pin)
                return res.status(400).json({ message: "Sai mã pin" })

            if (course.status !== STATUS.PUBLIC) {
                return res.status(400).json({ message: "Khóa học này chưa được phát hành!" })
            }
            if (!course.students.find(item => item.toString() === user.id.toString())) {
                course.students.push(user.id)
            }
            else {
                return res.status(400).json({ message: "Học viên đã thuộc lớp học!" })
            }
            await course.save()
            return res.status(200).json({
                message: "Tham gia khóa học thành công!",
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đăng ký khoá học!" })
        }
    },
    exitCourse: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId } = req.body

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại!" })
            }
            const course = await Course.findOne({ courseId: Number(courseId) })
            if (!course)
                return res.status(400).json({ message: "Không tồn tại khóa học!" })

            course.students = course.students.filter(item => item.toString() !== user.id.toString())

            await course.save()
            return res.status(200).json({
                message: "Rời khóa học thành công!",
            })
        }
        catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi rời khoá học!" })
        }
    },
    deleteExam: async (req, res) => {
        try {
            const username = req.user?.sub
            const { examId, courseId } = req.body

            const teacher = await User.findOne({ username })
            const exam = await Exam.findOne({ _id: new mongoose.Types.ObjectId(examId), creatorId: teacher.id })

            if (!teacher) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            if (!exam) {
                return res.status(400).json({ message: "Bài tập không tồn tại" })
            }

            let course = await Course.findOne({ _id: new mongoose.Types.ObjectId(courseId), creatorId: teacher.id })
            if (!course)
                return res.status(400).json({
                    message: "Không tìm thấy khoá học",
                })

            if (course.exams.find(item => item.toString() === exam.id.toString())) {//nếu chưa có sinh viên trên
                course.exams = course.exams.filter(item => item.toString() !== exam.id.toString())
                await TakeExam.deleteMany({ examId })
            }
            else {
                return res.status(400).json({ message: "Bài kiểm tra không thuộc khóa học." })
            }
            await course.save()
            return res.status(200).json({
                message: "Xoá bài kiểm tra thành công!",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi xóa bài kiểm tra!" })
        }
    },
    GetListCoursePublic: async (req, res) => {
        try {

            let courses = await Course.find({ status: STATUS.PUBLIC })
                .populate({
                    path: "creatorId",
                    select: "fullname"
                })
            let results = courses.map(item => {
                let { exams, students, lessons, assignments, pin, ...data } = item._doc

                return {
                    ...data,
                }
            })

            if (courses) {
                return res.status(200).json(results)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học nào",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi hiển thị khoá học!" })
        }
    },

    GetListCourseSell: async (req, res) => {
        try {

            let courses = await Course.find({ status: STATUS.PUBLIC, price: { $gt: 0 } }).populate({
                path: "creatorId",
                select: "fullname"
            })
            let results = courses.map(item => {
                let { exams, students, lessons, assignments, pin, ...data } = item._doc

                return {
                    ...data,
                }
            })

            if (courses) {
                return res.status(200).json(results)
            }
            return res.status(400).json({
                message: "Không tìm thấy khoá học nào",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi hiển thị khoá học!" })
        }
    },

    Search: async (req, res) => {
        try {
            let loginUsername
            const token = req.headers.authorization;
            if (token) {
                const accessToken = token.split(" ")[1];
                jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
                    if (err) {
                        return res.status(403).json({ message: "Token không hợp lệ" });
                    }
                    loginUsername = user?.sub;
                })
            }

            const loginUser = await User.findOne({ username: loginUsername })
            const keyword = req.query.search
                ? {
                    $or: [
                        { name: { $regex: req.query.search, $options: "i" } },
                        { description: { $regex: req.query.search, $options: "i" } },
                    ],
                }
                : {};
            const courses = await Course.find(keyword)
            if (courses.length === 0)

                return res.status(400).json({ message: "Không tìm thấy khóa học!" })
            let results = courses.map(item => {
                let isInCourse = false
                if (loginUser)
                    if (item.students.find(e => e.toString() === loginUser.id.toString())) {
                        isInCourse = true
                    }

                let { exams, students, lessons, assignments, pin, ...data } = item._doc
                return {
                    ...data,
                    isInCourse
                }
            })
            return res.status(200).json(results);

        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi tìm khóa học!" })
        }
    },
    duplicateCourse: async (req, res) => {
        try {
            const username = req.user?.sub
            const { courseId } = req.body

            const teacher = await User.findOne({ username })
            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId) })
                .populate("lessons").populate("assignments").populate({
                    path: "exams",
                    populate: {
                        path: "questions.question",
                        populate: {
                            path: "answers"
                        }
                    }

                })
            if (!teacher) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            if (!course) {
                return res.status(400).json({ message: "Khóa học không tồn tại" })
            }

            const newCourse = new Course({
                _id: new mongoose.Types.ObjectId(),
                name: course.name + " - Copy",
                startTime: course.startTime,
                endTime: course.endTime,
                description: course.description,
                price: course.price,
                creatorId: teacher.id,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                students: [],
                lessons: [],
                exams: [],
                assignments: [],
                pin: "",
                slug: course.slug + "-copy" + Date.now(),
                status: STATUS.PRIVATE

            })
            const lessons = course.lessons
            for (let i = 0; i < lessons.length; i++) {
                const lesson = lessons[i]
                const newLesson = new Lesson({
                    _id: new mongoose.Types.ObjectId(),
                    name: lesson.name + " - Copy",
                    content: lesson.content,
                    creatorId: teacher.id,
                    startTime: lesson.startTime,
                    endTime: lesson.endTime,
                    file: lesson.file,
                    status: lesson.status,
                    courseId: newCourse.id,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),

                })
                await newLesson.save()
                newCourse.lessons.push(newLesson.id)
            }
            const exams = course.exams
            for (let i = 0; i < exams.length; i++) {
                const exam = exams[i]
                const newExam = new Exam({
                    _id: new mongoose.Types.ObjectId(),
                    name: exam.name + " - Copy",
                    creatorId: teacher.id,
                    description: exam.description,
                    pin: "",
                    startTime: exam.startTime,
                    endTime: exam.endTime,
                    numberofQuestions: exam.numberofQuestions,
                    viewPoint: exam.viewPoint,
                    viewAnswer: exam.viewAnswer,
                    attemptsAllowed: exam.attemptsAllowed,
                    maxPoints: exam.maxPoints,
                    typeofPoint: exam.typeofPoint,
                    maxTimes: exam.maxTimes,
                    tracking: exam.tracking,
                    shuffle: exam.shuffle,
                    status: exam.status,
                    questions: [],

                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
                newCourse.exams.push(newExam.id)
                const questions = exam.questions
                for (let j = 0; j < questions.length; j++) {
                    const question = questions[j]
                    //console.log(JSON.stringify(question.question.answers))
                    const newQuestion = new Question({
                        //...question._doc,

                        _id: new mongoose.Types.ObjectId(),

                        //examId: newExam.id,
                        type: question.question.type,
                        content: question.question.content,
                        maxPoints: question.question.point,
                        image: question.question.image,
                        answers: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    })
                    newExam.questions.push({ question: newQuestion.id })

                    const answers = question.question.answers
                    console.log(JSON.stringify(answers))

                    for (let k = 0; k < answers.length; k++) {
                        const answer = answers[k]
                        const newAnswer = new Answer({
                            ...answer._doc,
                            _id: new mongoose.Types.ObjectId(),
                            //questionId: newQuestion.id,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        })
                        await newAnswer.save()
                        newQuestion.answers.push(newAnswer.id)
                    }
                    await newQuestion.save()
                }
                await newExam.save()
            }
            const assignments = course.assignments
            for (let i = 0; i < assignments.length; i++) {
                const assignment = assignments[i]
                const newAssignment = new Assignment({
                    _id: new mongoose.Types.ObjectId(),
                    name: assignment.name + " - Copy",
                    content: assignment.content,
                    creatorId: assignment.creatorId,
                    startTime: assignment.startTime,
                    endTime: assignment.endTime,
                    viewPoint: assignment.viewPoint,
                    maxPoints: assignment.maxPoints,
                    courseId: newCourse.id,
                    allowReSubmit: assignment.allowReSubmit,
                    allowSubmitLate: assignment.allowSubmitLate,
                    file: assignment.file,
                    status: assignment.status,
                    toPass: assignment.toPass,

                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
                await newAssignment.save()
                newCourse.assignments.push(newAssignment.id)
            }
            await newCourse.save()

            return res.status(200).json({
                message: "Tạo khóa học thành công!",
                course: newCourse
            })
        }

        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi tạo khóa học!" })
        }
    },

    //lấy danh sách khóa học bao gồm các bài giảng, bài tập và bài kiểm tra chi tiết các câu hỏi và câu trả lời
    getCourseDetail: async (req, res) => {
        try {
            const { courseId } = req.query
            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId) })
                .populate("lessons").populate("assignments").populate({
                    path: "exams",
                    populate: {
                        path: "questions.question",
                        populate: {
                            path: "answers"
                        }
                    }

                })
            if (!course) {
                return res.status(400).json({ message: "Khóa học không tồn tại" })
            }
            return res.status(200).json({
                message: "Lấy dữ liệu thành công!",
                course
            })
        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi lấy dữ liệu!" })
        }
    }




}

module.exports = { CourseController }
