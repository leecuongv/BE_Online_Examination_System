// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT, QUESTIONTYPE, ANSWERTYPE, VIEWANSWER } = require("../utils/enum");
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

  CheckExam: async (req, res) => {//
    try {
      const username = req.user?.sub;
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
          startTime: 1,
          endTime: 1,
          slug: 1,
          name: 1,
          questions: 1,
          maxTimes: 1,
          tracking: 1,
          attemptsAllowed: 1,
          shuffle: 1,
          allowOutTab: 1,
          allowOutFace: 1,
        });
      if (exam.shuffle === true) {
        let randomArray = [...exam.questions].sort(() => Math.random() - 0.5)
        exam.questions = await randomArray
      }
      let { questions, startTime, maxTimes, ...data } = exam._doc;
      questions = questions.map((item) => ({ ...item.question._doc, id: item.question._id, index: item.index }));

      if (!exam) res.status(200).json({ message: "invalid" });
      const course = await Course.findOne({ exams: { $in: [exam._id] } })
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
        return res.status(400).json({
          message: "Thời gian thực hiện bài thi không hợp lệ!",
          courseId: course.courseId
        })
      }

      if (exam.attemptsAllowed === 0) {
        if (lastTakeExam.status === STATUS.SUBMITTED)
          return res.status(200).json({ message: "checkpin" });
      } else {
        if (takeExam.length === exam.attemptsAllowed) {
          if (lastTakeExam.status === STATUS.SUBMITTED)
            return res.status(400).json({ message: "Bài thi đã được nộp, không thể làm lại", courseId: course.courseId }); //take exam cuối cùng đã hết thời gian
          if (remainTime < 0)
            return res.status(400).json({ message: "Hết thời gian làm bài thi làm bài thi", courseId: course.courseId }); //take exam cuối cùng đã hết thời gian
        } else if (takeExam.length > exam.attemptsAllowed)
          return res.status(400).json({ message: "Hết số lần làm bài thi", courseId: course.courseId }); //take exam cuối cùng đã hết thời gian
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
        countOutTab: lastTakeExam.countOutTab,
        countOutFace: lastTakeExam.countOutFace,
        allowOutTab: data.allowOutTab,
        allowOutFace: data.allowOutFace
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi làm bài thi" });
    }
  },

  CreateTakeExam: async (req, res) => {
    try {
      const username = req.user?.sub;

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
          allowOutTab: 1,
          allowOutFace: 1,
        });

      if (exam.shuffle === true) {
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
        return res.status(400).json({
          message: "Thời gian thực hiện bài thi không hợp lệ",
          courseId: course.courseId
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
          courseId: course.courseId
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
        countOutTab: takeExam.countOutTab,
        countOutFace: takeExam.countOutFace,
        allowOutTab: data.allowOutTab,
        allowOutFace: data.allowOutFace,
        courseId: course.courseId
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi làm bài thi" });
    }
  },

  submitAnswerSheet: async (req, res) => {
    try {
      const username = req.user?.sub
      const { answerSheet, takeExamId } = req.body
      console.log(answerSheet)

      const user = await User.findOne({ username })
      if (!user) return res.status(400).json({ message: "Không có người dùng" })

      const takeExam = await TakeExam.findById(takeExamId)
      // viết bổ sung thêm kiểm tra thời gian nộp hợp lệ (trễ không quá 2 phút), kiểm tra người làm bài


      const exam = await Exam.findById(takeExam.examId).populate({
        path: "questions.question",
        populate: {
          path: 'answers',
          select: 'id type isCorrect content'
        }
      })

      if (!exam) return res.status(400).json({ message: "Không có bài thi!" })
      let questions = exam.questions.map(element => element.question)//câu hỏi và đáp án từ exam

      let points = 0 //điểm đạt được của bài làm
      questions.forEach(question => {
        let pointOfQuestion = 0
        let questionClient = answerSheet.find(e => e.question === question.id.toString())
        if (question.type === QUESTIONTYPE.FILLIN) {
          //thay bằng Question result, answer
          if (questionClient)
            if (questionClient.answers.length > 0) {
              let isCorrect = question.answers.some(e => {
                if (e.type === ANSWERTYPE.EQUAL) {
                  return (e.content === questionClient.answers[0])
                }
                return (e.content.includes(questionClient.answers[0]))
              })
              if (isCorrect)
                pointOfQuestion = question.maxPoints
            }
        }
        else {

          let noAnswerCorrect = question.answers.filter(e => e.isCorrect).length //số đáp án đúng
          if (!questionClient) {
            if (noAnswerCorrect === 0)
              pointOfQuestion = question.maxPoints
          }

          else {
            if (noAnswerCorrect === 0) {
              if (questionClient.answers.length === 0)
                pointOfQuestion = question.maxPoints
            }
            else {

              let pointEachAnswer = question.maxPoints / noAnswerCorrect
              question.answers.forEach(answer => {
                if (questionClient.answers.includes(answer.id.toString()))
                  if (answer.isCorrect)
                    pointOfQuestion += pointEachAnswer
                  else
                    pointOfQuestion -= pointEachAnswer
              })
            }
          }
        }
        pointOfQuestion = pointOfQuestion > 0 ? pointOfQuestion : 0
        questionClient.point = pointOfQuestion

        points += pointOfQuestion
      })

      takeExam.points = points
      takeExam.status = STATUS.SUBMITTED
      takeExam.submitTime = new Date()
      // let result = answerSheet.map(item => {
      //   try {
      //     let answers = item.answers.map(e => {
      //       try {
      //         return mongoose.Types.ObjectId(e)
      //       }
      //       catch {
      //         return null
      //       }
      //     })
      //     answers = answers.filter(e => e !== null)
      //     return {
      //       point: item.point,
      //       question: mongoose.Types.ObjectId(item.question),
      //       answers
      //     }
      //   }
      //   catch {
      //     return null
      //   }
      // })
      let result = answerSheet.map(item => {
        try {
          let answers = []
          if (Array.isArray(item.answers)) {
            answers = item.answers
          }

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
      if ((points / exam.maxPoints) >= (exam.toPass / 100)) {
        takeExam.isPass = true
      }
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
      const username = req.user?.sub;

      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });

      const takeExam = await TakeExam.findById(takeExamId).populate('examId')
      const takeExams = await TakeExam.find({ examId: takeExam.examId.id, userId: user.id })

      const course = await Course.findOne({ exams: { $in: [takeExam.examId.id] } })

      const index = takeExams.findIndex(item => item.id.toString() === takeExamId)
      if (!takeExam) return res.status(400).json({ message: "Không có lịch sử làm bài!" })
      if (takeExam.examId.viewPoint === 'no')
        return res.status(200).json({
          name: takeExam.examId.name,
          lanThi: index + 1,
          courseId: course.courseId,
          viewAnswer: takeExam.examId.viewAnswer,
          slug: takeExam.examId.slug,
        })
      return res.status(200).json({
        name: takeExam.examId.name,
        slug: takeExam.examId.slug,
        lanThi: index + 1,
        points: takeExam.points,
        maxPoints: takeExam.examId.maxPoints,
        courseId: course.courseId,
        viewAnswer: takeExam.examId.viewAnswer,
        countOutTab: takeExam.countOutTab,
        countOutFace: takeExam.countOutFace,

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
      const username = req.user?.sub;
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng!" });

      const takeExam = await TakeExam.findById(takeExamId)

      const exam = await Exam.findById(takeExam.examId)
        .populate({
          path: "questions.question",
          populate: {
            path: "answers",
            select: "id content isCorrect type",
          },
        }).lean()
      let { questions, startTime, maxTimes, _id, ...data } = exam;
      questions = questions.map((item) => item.question);
      const course = await Course.findOne({ exams: { $in: [_id] } })
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
          countId: course.courseId,
          points: (exam.viewPoint === 'no' ||
            (exam.viewPoint === 'alldone' && moment().diff(exam.endTime, 'minutes') > 0)) ? undefined : takeExam.points,

        })

    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi hiện điểm" });
    }

  },

  createLogs: async (req, res) => {
    try {
      const { action, takeExamId, countOutFace, countOutTab } = req.body;
      const username = req.user?.sub;

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
      await TakeExam.findByIdAndUpdate(mongoose.Types.ObjectId(takeExamId), { countOutFace, countOutTab }, { new: true })
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
      const username = req.user?.sub;

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

      return res.status(200).json({ listTakeExam })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: "Không xác định" })
    }
  },
  ViewAccuracyRateOfExamQuestions: async (req, res) => {
    try {
      const username = req.user?.sub
      const { slug } = req.query

      if (!username) return res.status(400).json({ message: "Không có người dùng" })
      const user = await User.findOne({ username })

      if (!user) return res.status(400).json({ message: "Không có người dùng" })
      let creatorId = user.id
      const exam = await Exam.findOne({
        slug,
        creatorId
      })

      if (!exam) {
        return res.status(400).json({ message: "Không tồn tại bài thi!" })
        console.log(exam)
      }

      // let examResult = await TakeExam.aggregate([
      //     {
      //         $match: { examId: { $in: [mongoose.Types.ObjectId(id)] } }
      //     },

      // ])

      let examResult = await TakeExam.find({ examId: mongoose.Types.ObjectId(exam.id) }).populate({
        path: "result.question",
        populate: {
          path: "answers",
          select: "id content",
        },
        select: "id content answers",

      })


      let listQuestion = []
      examResult.forEach(item => {
        item.result.forEach(question => {
          listQuestion.push(question)
        })
      })
      let jsonArray = listQuestion
      let test = new Array(jsonArray.length).fill(0);
      let result = new Array();
      for (let i = 0; i < jsonArray.length; i++) {
        let jo = {};
        let tempStringi = jsonArray[i].question;
        let ja = new Array();

        if (test[i] === 0) {
          jo.question = tempStringi;
          ja.push(jsonArray[i]);
          test[i] = 1;
          for (let j = i + 1; j < jsonArray.length; j++) {
            let tempStringj = jsonArray[j].question
            if ((tempStringi.toString().localeCompare(tempStringj.toString())) === 0 && (test[j] === 0)) {
              // jsonArray.get(j).getAsJsonObject().remove(question); 
              ja.push(jsonArray[j]);
              test[j] = 1;
            }
          }

          //jo.questions = ja;
          jo["tongSoHVDaLamCauHoi"] = ja.length;
          jo["soHVDaLamDung"] = ja.filter(element => element.point > 0).length
          jo["soHVDaLamSai"] = ja.filter(element => element.point === 0).length
          //jo["soHVChuaLam"] =
          result.push(jo);
        }
      }

      return res.status(200).json({
        //listQuestion,
        result,
        //examResult
      })

    } catch (error) {
      console.log(error)
      res.status(400).json({ message: "Lỗi xem kết quả bài thi!" })
    }
  },

  ViewExamScoreDistribution: async (req, res) => {
    try {
      const username = req.user?.sub
      const { slug } = req.query

      if (!username) return res.status(400).json({ message: "Không có người dùng" })
      const user = await User.findOne({ username })

      if (!user) return res.status(400).json({ message: "Không có người dùng" })
      let creatorId = user.id
      const exam = await Exam.findOne({
        slug,
        creatorId
      })

      if (!exam) {
        return res.status(400).json({ message: "Không tồn tại bài thi!" })
      }

      // let examResult = await TakeExam.aggregate([
      //     {
      //         $match: { examId: { $in: [mongoose.Types.ObjectId(id)] } }
      //     },

      // ])

      let examResult = await TakeExam.find({ examId: mongoose.Types.ObjectId(exam.id), status: STATUS.SUBMITTED }).select({ examId: 1, userId: 1, points: 1, id: 1 })
      const dataset = [];
      const labels = [];

      const freq = examResult.reduce(function (prev, cur) {
        prev[cur.points] = (prev[cur.points] || 0) + 1;
        return prev;
      }, {})
      for (const key in freq) {
        if (freq.hasOwnProperty(key)) {
          let obj = { points: key, freq: freq[key] }
          labels.push(obj);
        }
      }
      return res.status(200).json({
        //listQuestion,
        //examResult,
        labels,
        maxPoints: exam.maxPoints
        //examResult
      })

    } catch (error) {
      console.log(error)
      res.status(400).json({ message: "Lỗi xem kết quả bài thi!" })
    }
  }
};

module.exports = { TakeExamController };
