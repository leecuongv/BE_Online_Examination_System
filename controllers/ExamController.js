const Exam = require("../models/Exam")
const mongoose = require("mongoose");
const Course = require("../models/Course")
const User = require("../models/User")
const QuestionBank = require("../models/QuestionBank");

const ExamController = {
    CreateExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { name, description, courseId, numberOfQuestion, viewPoint, viewAnswer,
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
    UpdateExam: async (req, res) => {
        try {
            const username = req.user.sub
            const { id, name, description, courseId, numberofQuestions, viewPoint, viewAnswer,
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
            let exitExam = new Exam({
                id,
                name,
                description,
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
            })
            let error = exitExam.validateSync()
            if (error) {
                console.log(error)
                return res.status(400).json({
                    message: "Tạo bài thi thất bại!"
                })
            }
            //const exam = await newExam.save();

            //course.exams.push(exam.id);
            //await course.save()

            exitExam = await Exam.findByIdAndUpdate(id, {
                name, description, numberofQuestions, viewPoint, viewAnswer,
                attemptsAllowed, maxPoints, typeofPoint, maxTimes, tracking, shuffle, startTime, endTime
            }, { new: true })
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
            const { examId, questionBankId, numberOfQuestion, random } = req.body;
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



            /*
            const examResult = await ExamResult.findOne({ takeExamId: mongoose.Types.ObjectId(takeExamId) })
                .populate('takeExamId')
            const exam = await Exam.findById(examResult.takeExamId.exam)
              .populate({
                path: "questions.question",
                populate: {
                  path: "answers",
                  select: "id content isCorrect",
                },
              })
            let { questions, startTime, maxTimes, ...data } = exam._doc;
            questions = questions.map((item) => item.question);
      
            const result = examResult.result
      
            questions = questions.map(item => {
      
              let resultAnswer = result.find(e => e.question?.toString() === item.id.toString())
              let choose = []
              if (resultAnswer) {
                choose = resultAnswer.answers
              }
      
              return { ...item._doc, choose }
            })
      
            console.log(questions)
            return res.status(200).json(
              {
                name: examResult.takeExamId.name,
                startTime: examResult.takeExamId.startTime,
                submitTime: examResult.takeExamId.submitTime,
                questions: questions
              })
              */
            return res.status(200).json({
                message: "Lấy ds câu hỏi thành con nhà bà công!",
                questions: questions
            })
        }
        catch (error) {
            console.log(error);
            res.status(400).json({ message: "Lỗi hiện điểm" });
        }

    },
    createLogs: async (req, res) => {

    },
    addQuestionWithQuestionBank: async (req, res) => {
        try {
            //Lấy cái parameter
            const username = req.user?.sub
            const { examId, questionBankId, numberOfQuestion, random } = req.body


            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: "Tài khoản không tồn tại" })
            }

            const exam = await Exam.findOne({ _id: new mongoose.Types.ObjectId(examId), creatorId: user.id })
            if (!exam)
                return res.status(400).json({ message: "Bài kiểm tra không tồn tại!" })

            let questionBank = await QuestionBank.findOne({ _id: new mongoose.Types.ObjectId(questionBankId), creatorId: user.id })
            if (!questionBank)
                return res.status(400).json({
                    message: "Không tìm thấy ngân hàng câu hỏi!",
                })
            var questions = []
            var n = 1
            var index = 1
            if (random === true) {
                while (n <= numberOfQuestion) {
                    var newQuestion = questionBank.questions[Math.floor(Math.random() * questionBank.questions.length)]

                    //console.log(newQuestion)

                    if (!exam.questions.find(item => item.question.toString() === newQuestion.toString())) {
                        questions.push({ question: newQuestion });
                        exam.questions.push({ question: newQuestion });
                        n++;
                    }

                    index++;

                    if (index === numberOfQuestion)
                        return res.status(400).json({ message: "Các câu hỏi đã tồn tại trong hệ thống" })
                }

            }

            await exam.save()
            console.log("\n haha" + questions)
            return res.status(200).json({
                message: "Lấy danh sách câu hỏi thành công",
                questions: questions
            })

        } catch (error) {
            console.log(error)
            res.status(400).json({ message: "Lỗi tạo!" })
        }
    },
};


module.exports = { ExamController }