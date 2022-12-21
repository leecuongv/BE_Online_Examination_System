// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const ExamLog = require("../models/ExamLog");
const TakeExamController = {
  getExam: async (takeExam) => {

    let exam = await Exam.findById(takeExam.examId)
      .populate({
        path: "questions.question",
        populate: {
          path: "answers",
          select: "id content",
        },
      })
      .select({ slug: 1, name: 1, questions: 1, maxTimes: 1, tracking: 1 });
    let { questions, startTime, maxTimes, ...data } = exam._doc;
    let endTime = moment(takeExam.startTime).add(maxTimes, "minutes").toDate();
    questions = questions.map((item) => item.question);
    return { ...data, endTime, questions };
  },

  CheckExam: async (req, res) => {
    try {
      const username = req.user.sub;
      const { slug } = req.body;

      const user = await User.findOne({ username });
      if (!user)
        return res.status(400).json({ message: "Không có người dùng" });

      let exam = await Exam.findOne({ slug })
        .populate({
          path: "questions.question",
          populate: {
            path: "answers",
            select: "id content",
          },
        })
        .select({
          startTime:1,
          endTime:1,
          slug: 1,
          name: 1,
          questions: 1,
          maxTimes: 1,
          tracking: 1,
          attemptsAllowed: 1,
        });
      let { questions, startTime, maxTimes, ...data } = exam._doc;
      questions = questions.map((item) => ({ ...item.question._doc, id: item.question._id, index: item.index }));

      if (!exam) res.status(200).json({ message: "invalid" });

      const takeExam = await TakeExam.find({ userId: user.id, examId: exam.id });
      ///kiểm tra hợp lệ
      if (takeExam.length === 0)
        return res.status(200).json({ message: "checkpin" });


      const toDay = new Date()

      const lastTakeExam = takeExam[takeExam.length - 1];
      const remainTime = moment(lastTakeExam.startTime)
        .add(exam.maxTimes, "minutes")
        .diff(new Date(), "minutes");

      if ((new Date(toDay)) < (new Date(exam.startTime)) ||
        (new Date(toDay)) > (new Date(exam.endTime))) {
        console.log(toDay)
        return res.status(400).json({
          message: "Thời gian thực hiện bài thi không hợp lệ"
        })
      }

      if (exam.attemptsAllowed === 0) {
        if (lastTakeExam.status === STATUS.SUBMITTED)
          return res.status(200).json({ message: "checkpin" });
      } else {
        if (takeExam.length === exam.attemptsAllowed) {
          if (lastTakeExam.status === STATUS.SUBMITTED)
            return res.status(400).json({ message: "Hết số lần làm bài thi" }); //take exam cuối cùng đã hết thời gian
          if (remainTime < 0)
            return res.status(400).json({ message: "Hết số lần làm bài thi" }); //take exam cuối cùng đã hết thời gian
        } else if (takeExam.length > exam.attemptsAllowed)
          return res.status(400).json({ message: "Hết số lần làm bài thi" }); //take exam cuối cùng đã hết thời gian
      }
      if (lastTakeExam.status === STATUS.SUBMITTED)
        return res.status(200).json({ message: "checkpin" }); //take exam cuối cùng đã hết thời gian
      if (remainTime < 0) return res.status(200).json({ message: "checkpin" }); //take exam cuối cùng đã hết thời gian

      let endTime = moment(lastTakeExam.startTime)
        .add(maxTimes, "minutes")
        .toDate();
      return res.status(200).json({
        message: "valid",
        exam: {
          ...data,
          questions,
          endTime,
        },
        takeExamId: lastTakeExam.id,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi làm bài thi" });
    }
  },

  CreateTakeExam: async (req, res) => {
    try {
      const username = req.user.sub;


      const { slug, pin } = req.body;

      const toDay = new Date()
      if (!username)
        return res.status(400).json({ message: "Không có người dùng" });
      const user = await User.findOne({ username });
      if (!user)
        return res.status(400).json({ message: "Không có người dùng" });
      const exam = await Exam.findOne({ slug })
        .populate({
          path: "questions.question",
          populate: {
            path: "answers",
            select: "id content",
          },
        })
        .select({
          slug: 1,
          name: 1,
          questions: 1,
          maxTimes: 1,
          tracking: 1,
          pin: 1,
          shuffle: 1,
        });

      if (exam.shuffle === true) {

        console.log("Chưa random \n " + exam)
        let randomArray = [...exam.questions].sort(() => Math.random() - 0.5)
        exam.questions = await randomArray
      }
      let { questions, startTime, maxTimes, ...data } = exam._doc;
      let endTime = moment(new Date()).add(maxTimes, "minutes").toDate();
      questions = questions.map((item) => ({ ...item.question._doc, id: item.question._id, index: item.index }));

      if (exam.pin !== "") {
        if (exam.pin !== pin)
          return res.status(400).json({ message: "Sai mật khẩu!" });
      }
      //if()
      if (!exam) return res.status(400).json({ message: "Không có bài thi!" });
      const course = await Course.findOne({
        $and: [
          {
            $or: [{ students: { $in: [user.id] } }, { creatorId: user.id }],
          },
          { exams: { $in: [exam._id] } },
        ],
      });
      if (!course)
        return res
          .status(400)
          .json({ message: "Thí sinh không thuộc bài thi này!" });

      if ((new Date(toDay)) < (new Date(course.startTime)) ||
        (new Date(toDay)) > (new Date(course.endTime))) {
        console.log(toDay)
        return res.status(400).json({
          message: "Thời gian thực hiện bài thi không hợp lệ"
        })
      }
      // const takeExams = TakeExam.find({})  
      // const countTakeExam = takeExam.length - 1;
      // if (countTakeExam > exam.attemptsAllowed)
      //   return res.status(400).json({
      //     message: "Đã quá số lần làm bài"
      //   })
      const newTakeExam = new TakeExam({
        examId: exam.id,
        userId: user.id,
        startTime: new Date(),
        submitTime: new Date()
      });
      let error = newTakeExam.validateSync();
      if (error) {
        console.log(error);
        return res.status(400).json({
          message: "Làm bài thi thất bại!",
        });
      }
      const takeExam = await newTakeExam.save();
      const newExamLog = new ExamLog({ takeExamId: takeExam.id });
      await newExamLog.save();
      return res.status(200).json({
        message: "Làm bài thi thành công!",
        takeExamId: takeExam.id,
        exam: {
          ...data,
          questions,
          endTime,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi làm bài thi" });
    }
  },

  submitAnswerSheet: async (req, res) => {
    try {
      const username = req.user.sub
      const { answerSheet, takeExamId } = req.body

      const user = await User.findOne({ username })
      if (!user) return res.status(400).json({ message: "Không có người dùng" })

      const takeExam = await TakeExam.findById(takeExamId)
      // viết bổ sung thêm kiểm tra thời gian nộp hợp lệ (trễ không quá 2 phút), kiểm tra người làm bài


      const exam = await Exam.findById(takeExam.examId).populate({
        path: "questions.question",
        populate: {
          path: 'answers',
          select: 'id isCorrect'
        }
      })

      if (!exam) return res.status(400).json({ message: "Không có bài thi!" })
      let questions = exam.questions.map(element => element.question)//câu hỏi và đáp án từ exam

      let points = 0
      questions.forEach(question => {
        let pointOfQuestion = 0
        let noAnswerCorrect = question.answers.filter(e => e.isCorrect).length //số đáp án đúng
        let questionClient = answerSheet.find(e => e.question === question.id.toString())
        //thay bằng Question result, answer
        if (!questionClient) {
          if (noAnswerCorrect === 0)
            points += question.maxPoints
          else
            points += 0
        }
        else {
          if (noAnswerCorrect === 0) {
            if (questionClient.answers.length === 0)
              points += question.maxPoints
            else
              points += 0
          }
          else {

            let pointEachAnswer = question.maxPoints / noAnswerCorrect
            question.answers.forEach(answer => {
              if (answer.isCorrect) {//
                if (questionClient.answers.includes(answer.id.toString()))
                  pointOfQuestion += pointEachAnswer
              }
              else {
                if (questionClient.answers.includes(answer.id.toString()))
                  pointOfQuestion -= pointEachAnswer
              }

            })

            pointOfQuestion = pointOfQuestion > 0 ? pointOfQuestion : 0
            questionClient.point = pointOfQuestion

            points += pointOfQuestion
          }
        }
      })

      takeExam.points = points
      takeExam.status = STATUS.SUBMITTED
      takeExam.submitTime = new Date()
      let result = answerSheet.map(item => {
        try {
          let answers = item.answers.map(e => {
            try {
              return mongoose.Types.ObjectId(e)
            }
            catch {
              return null
            }
          })
          answers = answers.filter(e => e !== null)
          return {
            point: item.point,
            question: mongoose.Types.ObjectId(item.question),
            answers
          }
        }
        catch {
          return null
        }
      })
      result = result.filter(e => e !== null)
      takeExam.result = result
      await takeExam.save()

      return res.status(200).json({
        message: "Nộp bài thi thành công!"
      })

    } catch (error) {
      console.log(error)
      res.status(400).json({ message: "Lỗi làm bài thi" })
    }
  },

  getResultTakeExam: async (req, res) => {

    try {
      const { takeExamId } = req.query;
      const username = req.user.sub;

      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });

      const takeExam = await TakeExam.findById(takeExamId).populate('examId')
      const takeExams = await TakeExam.find({ examId: takeExam.examId.id, userId: user.id })
      
      const course = await Course.findOne({exams:{$in:[takeExam.examId.id]}})
      console.log("Course finding: \n"+ course.id)

      const index = takeExams.findIndex(item => item.id.toString() === takeExamId)
      if (!takeExam) return res.status(400).json({ message: "Không có lịch sử làm bài!" })
      if (takeExam.examId.viewPoint === 'no')
        return res.status(200).json({
          name: takeExam.examId.name,
          lanThi: index + 1,
          courseId: course.courseId,
          viewAnswer: takeExam.examId.viewAnswer

        })
      return res.status(200).json({
        name: takeExam.examId.name,
        lanThi: index + 1,
        points: takeExam.points,
        maxPoints: takeExam.examId.maxPoints,
        courseId: course.courseId,
        viewAnswer: takeExam.examId.viewAnswer
      })
    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi hiện điểm" });
    }
  },


  getPreviewExam: async (req, res) => {
    try {
      const { takeExamId } = req.query;
      const username = req.user.sub;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });

      const takeExam = await TakeExam.findById(takeExamId)

      const exam = await Exam.findById(takeExam.examId)
        .populate({
          path: "questions.question",
          populate: {
            path: "answers",
            select: "id content isCorrect",
          },
        }).lean()

      let { questions, startTime, maxTimes, ...data } = exam;
      questions = questions.map((item) => item.question);

      const result = takeExam.result

      questions = questions.map(item => {
        let { answers, ...questionData } = item
        let resultAnswer = result.find(e => e.question?.toString() === item._id.toString())
        let choose = []
        let point = 0
        if (resultAnswer) {
          choose = resultAnswer.answers
          point = resultAnswer.point
        }
        let toDay = new Date()
        if (exam.viewAnswer === 'no' || (exam.viewAnswer === 'alldone' && moment().diff(exam.endTime, 'minutes') > 0)) {
          answers = answers.map(item => {
            delete item.isCorrect
            return item
          })
        }
        if (exam.viewPoint === 'no' || (exam.viewPoint === 'alldone' && moment().diff(exam.endTime, 'minutes') > 0)) {
          return { ...questionData, answers, choose }
        }
        return { ...questionData, answers, choose, point }
      })

      return res.status(200).json(
        {
          name: exam.name,
          startTime: takeExam.startTime,
          submitTime: takeExam.submitTime,
          questions: questions,
          viewPoint: exam.viewPoint,
          viewAnswer: exam.viewAnswer,
          maxPoints: exam.maxPoints,
          points: (exam.viewPoint === 'no' ||
            (exam.viewPoint === 'alldone' && moment().diff(exam.endTime, 'minutes') > 0)) ? undefined : takeExam.points
        })

    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi hiện điểm" });
    }

  },

  createLogs: async (req, res) => {
    try {
      const { action, takeExamId } = req.body;
      const username = req.user.sub;

      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });

      const takeExam = await TakeExam.findById(takeExamId)
      if (!takeExam) return res.status(400).json({ message: "Không có lịch sử làm bài!" })

      let examLog = await ExamLog.findOne({ takeExamId: takeExam.id })

      if (!examLog) {
        examLog = new ExamLog({ takeExamId: takeExam.id, logs: [] })

      }
      examLog.logs.push({
        time: new Date(),
        action
      })
      await examLog.save()
      return res.status(200).json({
        message: 'Tạo thành công'
      })
    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi tạo lịch sử" });
    }
  },

  getLogs: async (req, res) => {
    try {
      const { takeExamId } = req.query;
      const username = req.user.sub;

      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });

      const examLogs = await ExamLog.findOne({ takeExamId: mongoose.Types.ObjectId(takeExamId) })
      if (!examLogs) return res.status(400).json({ message: "Không có lịch sử làm bài!" })

      return res.status(200).json(examLogs)
    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi tạo lịch sử" });
    }
  },
  getAllTakeExam: async (req, res) => {
    try {

      const username = req.user?.sub
      const user = await User.findOne({ username })
      if (!user) {
        return res.status(400).json({ message: "Tài khoản không tồn tại" })
      }

      const listTakeExam = await TakeExam.find({ userId: user.id })
      console.log(listTakeExam)

      return res.status(200).json({ listTakeExam })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: "Không xác định" })
    }
  },
};

module.exports = { TakeExamController };
