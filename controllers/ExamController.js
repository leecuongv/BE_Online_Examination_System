const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question")
const { STATUS } = require("../utils/enum");
const TakeExam = require("../models/TakeExam");
const lodash = require('lodash');

const ExamController = {
    CreateExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { name, description, pin, courseId, numberofQuestions, viewPoint, viewAnswer,
                attemptsAllowed, maxPoints, typeofPoint, maxTimes, tracking, shuffle, status, startTime, endTime } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học" })



            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })

            }

            if ((new Date(startTime)) < (new Date(course.startTime)) || (new Date(endTime)) > (new Date(course.endTime)))
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })

            const newExam = await new Exam({

                name,
                description,
                pin,
                creatorId: user.id,
                numberofQuestions: 0,
                viewPoint,
                viewAnswer,
                attemptsAllowed,
                maxPoints: 0,
                typeofPoint,
                maxTimes,
                tracking,
                shuffle,
                status: STATUS.PRIVATE,
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            })
            let error = newExam.validateSync()
            if (error) {
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
            const username = req.user.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const { slug } = req.query
            console.log(slug)
            const exam = await Exam.findOne({ slug, creatorId: user.id })
                .populate({
                    path: 'questions.question',
                    populate: {
                        path: 'answers'
                    }
                })
            if (exam) {
                return res.status(200).json(exam._doc)
            }

            return res.status(400).json({
                message: "Không tìm thấy bài thi",
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },
    getExamBySlugByStudent: async (req, res) => {
        try {
            const username = req.user.sub
            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })
            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            const { slug } = req.query
            console.log(slug)
            const exam = await Exam.findOne({ slug })
                .populate({
                    path: 'questions.question',
                    populate: {
                        path: 'answers'
                    }
                })
            if (!exam) {
                return res.status(400).json({
                    message: "Không tìm thấy bài thi",
                })
            }
            if (exam.shuffle === true) {

                console.log("Chưa random \n " + exam)
                let randomArray = [...exam.questions].sort(() => Math.random() - 0.5)
                exam.questions = await randomArray
            }
            return res.status(200).json(exam)

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },
    UpdateExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { id, name, description, pin, courseId, numberofQuestions, viewPoint, viewAnswer,
                attemptsAllowed, maxPoints, typeofPoint, maxTimes, tracking, shuffle, status, startTime, endTime } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })

            const course = await Course.findOne({ _id: mongoose.Types.ObjectId(courseId), creatorId: user.id })
            if (!course) return res.status(400).json({ message: "Thông tin không hợp lệ(không tìm thấy thông tin khóa học hoặc người tạo khóa học" })

            if (startTime === null || endTime === null
                || new Date(startTime).toLocaleString() === "Invalid Date"
                || new Date(endTime).toLocaleString() === "Invalid Date") {
                return res.status(400).json({ message: "Thời gian của khoá học không hợp lệ" })

            }

            let data = {
                name,
                description,
                pin,
                creatorId: user.id,
                numberofQuestions,
                viewPoint,
                viewAnswer,
                attemptsAllowed,
                maxPoints,
                typeofPoint,
                maxTimes,
                tracking,
                shuffle,
                status,
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            }
            //const exam = await newExam.save();

            //course.exams.push(exam.id);
            //await course.save()

            exitExam = await Exam.findByIdAndUpdate(id, data, { new: true })
            return res.status(200).json({
                message: "Tạo bài thi mới thành công",
                slug: exitExam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo bài thi" })
        }
    },
    createQuestionWithQuestionBank: async (req, res) => {
        try {
            const { examId, questionBankId, numberofQuestions, random } = req.body;
            const username = req.user.sub;

            if (!username)
                return res.status(400).json({ message: "Không tồn tại người dùng!" });
            const user = await User.findOne({ username });

            if (!user)
                return res.status(400).json({ message: "Không tồn tại người dùng!" });

            const exam = await Exam.findOne({ _id: mongoose.Types.ObjectId(examId), creatorId: user._id })
            if (!exam)
                return res.status(400).json({ message: "Không tồn tại bài thi!" })

            const questionBank = await QuestionBank.findOne({ _id: mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({ message: "Không tồn tại ngân hàng câu hỏi!" })

            const questionsResult = await QuestionBank.findOne({})
            return res.status(200).json({
                message: "Lấy danh câu hỏi thành công!",
                questions: questions
            })
        }
        catch (error) {
            console.log(error);
            res.status(400).json({ message: "Lỗi lấy danh sách câu hỏi" });
        }

    },

    addQuestionWithQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { examId, questionBankSlug, questionIds, numberofNeedQuestions, random } = req.body

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const exam = await Exam.findOne({ _id: new mongoose.Types.ObjectId(examId), creatorId: user.id })
            if (!exam)
                return res.status(400).json({ message: "Bài kiểm tra không tồn tại!" })

            let questionBank = await QuestionBank.findOne({ slug: questionBankSlug, creatorId: user.id })
                .populate({
                    path: 'questions',
                    populate: {
                        path: 'answers'
                    }
                })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi!",
                })
            let soCauHoiCanLay = 0
            let questionIdsTaken = []
            if (random === true) {

                let noneExistQuestion = []
                questionBank.questions.forEach(questionInQB => {
                    if (!exam.questions.find(item => item.question.toString() === questionInQB.id.toString())) {
                        noneExistQuestion.push(questionInQB.id)
                    }
                });
                console.log(noneExistQuestion)
                if (noneExistQuestion.length === 0) {
                    return res.status(400).json({ message: "Tất cả các câu hỏi đã tồn tại trong hệ thống" })
                }
                soCauHoiCanLay = noneExistQuestion.length <= numberofNeedQuestions ? noneExistQuestion.length : numberofNeedQuestions;

                noneExistQuestion = await Question.find({ _id: { $in: noneExistQuestion } })

                noneExistQuestion = noneExistQuestion.sort(() => Math.random() - 0.5);
                for (let i = 0; i < soCauHoiCanLay; i++) {
                    let newQuestion = noneExistQuestion.pop()
                    questionIdsTaken.push(newQuestion)
                    exam.questions.push({ question: newQuestion.id })
                    exam.maxPoints += Number(newQuestion.maxPoints) || 0
                    exam.numberofQuestions += 1
                }
            }

            else {
                let noneExistQuestion = []
                questionIds.forEach(questionInBody => {
                    if (!exam.questions.find(item => item.question.toString() === questionInBody.toString())) {
                        if (mongoose.Types.ObjectId.isValid(questionInBody))
                            noneExistQuestion.push(mongoose.Types.ObjectId(questionInBody))
                    }
                })
                if (noneExistQuestion.length === 0) {
                    return res.status(400).json({ message: "Tất cả các câu hỏi trong danh sách đã tồn tại trong hệ thống" })
                }

                noneExistQuestion = await Question.find({ _id: { $in: noneExistQuestion } })

                for (let i = 0; i < noneExistQuestion.length; i++) {
                    let newQuestion = noneExistQuestion.pop()
                    questionIdsTaken.push(newQuestion)
                    exam.questions.push({ question: newQuestion.id })
                    exam.maxPoints += Number(newQuestion.maxPoints) || 0
                    exam.numberofQuestions += 1
                }
            }
            exam.questions = exam.questions.map((item, index) => ({ ...item._doc, index: index + 1 }))//cập nhật lại index câu hỏi
            await exam.save()
            return res.status(200).json({
                message: "Lấy danh sách câu hỏi thành công",
                questions: questionIdsTaken,
                soCauHoiCanLay
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo!" })
        }
    },


    PublicExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsExam = await Exam.findById(id)


            console.log(exitsExam)
            const status = "public"
            exitsExam = await Exam.findByIdAndUpdate(id, {
                status
            }, { new: true })
            return res.status(200).json({
                message: "Xuất bản bài thi thành công",

                slug: exitsExam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài thi" })
        }
    },
    CloseExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsExam = await Exam.findById(id)


            console.log(exitsExam)

            exitsExam = await Exam.findByIdAndUpdate(id, {
                status: STATUS.CLOSE
            }, { new: true })
            return res.status(200).json({
                message: "Đóng bài thi thành công",

                slug: exitsExam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi đóng bài thi" })
        }
    },

    DeleteExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let exitsExam = await Exam.findById(id)


            console.log(exitsExam)
            exitsExam = await Exam.deleteOne(id)
            await TakeExam.deleteMany({ examId: id })
            return res.status(200).json({
                message: "Xuất bản bài thi thành công",

                slug: exitsExam._doc.slug
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài thi" })
        }
    },

    ViewExamResult: async (req, res) => {
        try {
            const username = req.user.sub
            const { id } = req.body

            if (!username) return res.status(400).json({ message: "Không có người dùng" })
            const user = await User.findOne({ username })

            if (!user) return res.status(400).json({ message: "Không có người dùng" })
            let examResult = await TakeExam.aggregate([
                {
                    $match: { examId: { $in: [mongoose.Types.ObjectId(id)] } }
                },
                // // {
                // //     $group: { _id: '$_id', count: { $sum: 1 } }
                // // }
                // { $unwind: "$result" },
                // {
                //     $group: {
                //         _id: {
                //             result: "$result.question",
                //             //point: "$result"
                //         },
                //         //totalPoint: { $sum: "$result.point" },
                //         point: { $push: "$result.point" },

                //         countResult: { $sum: 1 },
                        
                //     },

                // },
                // { $count: "totalCount" }
                { $group : { 
                    _id :  { 
                      category: "$category",
                      term: "$result",
                    },
                    total: { $sum : 1 } 
                 }
               },
                { $group : { 
                    _id :  "$_id",
                    terms: { 
                        $push: { 
                            term:"$_id.question",
                            total:"$total"
                        }
                    }
                 }
               }

            ])

            // Lấy kết quả bài thi từ API 
            const examResult2 = examResult; // Gom nhóm các câu hỏi theo thuộc tính "question" 
            const questionGroups = lodash.groupBy(examResult2[0].result, 'question'); // Tính tổng số điểm cho mỗi câu hỏi 

            //console.log(questionGroups)

            const questionScores = lodash.map(questionGroups, (group) => {
                const questionId = group[0].question;
                const pointSum = lodash.groupBy(group, 'question');
                return { questionId, pointSum };
            });
            //console.log(questionScores)


            //console.log(examResult2)


            return res.status(200).json({
                message: "Xuất bản bài thi thành công",

                examResult
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi xuất bản bài thi" })
        }
    }

};

module.exports = { ExamController }
