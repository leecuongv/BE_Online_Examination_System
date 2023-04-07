const Course = require("../models/Course")
const User = require("../models/User")
const mongoose = require("mongoose")
const generator = require("generate-password")
const { ROLES, STATUS } = require("../utils/enum")
const cloudinary = require('cloudinary').v2
const dotenv = require('dotenv')
const TakeExam = require("../models/TakeExam")
const Exam = require("../models/Exam")
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
            const course = await Course.findOne({ slug: slug, status: STATUS.PUBLIC })
            console.log(course)
            if (course) {
                const { name, description, exams, image } = course._doc
                return res.status(200).json({ name, description, exams, image })
            }

            return res.status(400).json({
                message: "Không tìm thấy khoá học",
            })

        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Lỗi tạo khoá học" })
        }
    },

    GetCourseInfoByCourseId: async (req, res) => {
        try {
            const { course_id } = req.query
            //console.log(slug)
            const course = await Course.findOne({ courseId: course_id }).populate({
                path: 'creatorId',
                select: 'fullname'
            })

            const course2 = await Course.aggregate([
                { $match: { courseId: 6 } },
                {
                    $project: {
                        name: 1,
                        description: 1,
                        image: 1,
                        status: 1,
                        startTime: 1,
                        endTime: 1,
                        creatorId:1,
                        numberOfExams: { $cond: { if: { $isArray: "$exams" }, then: { $size: "$exams" }, else: "NA" } },
                        numberOfAssignments: { $cond: { if: { $isArray: "$assignments" }, then: { $size: "$assignments" }, else: "NA" } },
                        numberOfLessons: { $cond: { if: { $isArray: "$lessons" }, then: { $size: "$lessons" }, else: "NA" } },
                        numberOfStudents: { $cond: { if: { $isArray: "$students" }, then: { $size: "$students" }, else: "NA" } },
                    }
                }
            ])
            console.log(course2)
            if (course) {
                const { name, description, image, status, creatorId, startTime, endTime } = course._doc
                return res.status(200).json({ name, description, image, status, creatorId, startTime, endTime })
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
            const username = req.user.sub

            const course = await Course.findOne({ courseId })
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
                                                            { $in: ["$examId", "$$examIds"] }
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
                                                            { $in: ["$assignmentId", "$$assignmentIds"] }
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
                        students: '$doc.students',
                        description: '$doc.description',
                        count: 1,
                        total: 1,
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] }
                    }
                }

            ]);
            if (course.length > 0) {
                if (!course[0].students.find(e => e.toString() === student.id.toString()))
                    return res.status(400).json({
                        message: "Học viên Không thuộc khoá học!",
                    })
                const { _id, courseId, name, description, exams, image, status, startTime, endTime, avg } = course[0]
                return res.status(200).json({ id: _id, courseId, name, description, exams, image, status, startTime, endTime, avg })
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
            const course = await Course.findOne({ courseId: Number(courseId) });

            if (course.length > 0) {
                if (!course[0].students.find(e => e.toString() === student.id.toString()))
                    return res.status(400).json({
                        message: "Học viên Không thuộc khoá học!",
                    })
                const { _id, courseId, name, description, exams, image, status, startTime, endTime, avg } = course[0]
                return res.status(200).json({ id: _id, courseId, name, description, exams, image, status, startTime, endTime, avg })
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
            const course = await Course.findOne({ courseId: Number(courseId) });
            if (course) {
                const { _id, courseId, name, description, exams, image, status, startTime, endTime, avg } = course._doc
                return res.status(200).json({ id: _id, courseId, name, description, exams, image, status, startTime, endTime, avg })
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
                                overwrite: true
                            })
                    data.image = upload.secure_url
                }
                catch (err) {
                    console.log(err);
                }

            }

            await Course.updateOne({ courseId }, data);
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
            // let studentCourse = await Course.find({
            //     students: { $in: [mongoose.Types.ObjectId(student.id)] }
            // });
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
                                                            { $in: ["$examId", "$$examIds"] }
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
                                                            { $in: ["$assignmentId", { $ifNull: ["$$assignmentIds", []] }] }
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
                        avg: { $cond: [{ $eq: ["$total", 0] }, "0", { "$divide": ["$count", "$total"] }] }
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
            //Lấy cái parameter
            const username = req.user?.sub
            const courseId = req.query.courseId
            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }
            console.log(courseId)

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
            const course = await Course.findOne({ courseId })
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
            const course = await Course.findOne({ courseId })
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
            //Lấy cái parameter
            const username = req.user?.sub
            const { examId, courseId } = req.body

            const teacher = await User.findOne({ username })
            //const student = await User.findById(studentId)
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
            // const loginUsername = req.user.sub
            // if (!loginUsername)
            //     return res.status(400).json({ message: "Vui lòng đăng nhập!" })
            // const loginUser = await User.findOne({ username: loginUsername })
            // if (!loginUser)
            //     return res.status(400).json({ message: "Không có người dùng!" })

            const keyword = req.query.search
                ? {
                    $or: [
                        { name: { $regex: req.query.search, $options: "i" } },
                        { description: { $regex: req.query.search, $options: "i" } },
                        //{ email: { $regex: req.query.search, $options: "i" } },
                    ],
                }
                : {};
            const courses = await Course.find(keyword)//.find({ _id: { $ne: req.course._id } });
            if (courses.length === 0)

                return res.status(400).json({ message: "Không tìm thấy khóa học!" })
            let results = courses.map(item => {
                let { exams, students, lessons, assignments, pin, ...data } = item._doc
                return {
                    ...data,
                }
            })
            return res.status(200).json(results);

        }
        catch (error) {
            console.log(error)
            return res.status(500).json({ message: "Lỗi tìm khóa học!" })
        }
    },
}

module.exports = { CourseController }
