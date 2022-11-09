// - Tạo 1 phiên kiểm tra (kiểm tra lại duration với startTime )
const Exam = require("../models/Exam");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const TakeExam = require("../models/TakeExam");
const { STATUS, VIEWPOINT } = require("../utils/enum");
const moment = require("moment/moment");
const ExamResult = require("../models/ExamResult");

const TakeExamController = {
  getExam: async (takeExam) => {

    let = await Exam.findById(takeExam.examId)
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
  CheckTakeExamId: async (req, res) => {
    try {
      const username = req.user.sub;
      const { takeExamId } = req.body;

      const user = await User.findOne({ username });
      if (!user)
        return res.status(400).json({ message: "Không có người dùng" });

      const takeExam = await TakeExam.findById(takeExamId);
      if (!takeExam || takeExam.status === STATUS.SUBMITTED)
        return res.status(200).json({ message: "invalid" });

      const exam = await TakeExamController.getExam(takeExam);
      return res.status(200).json({
        message: "valid",
        exam: exam,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Lỗi làm bài thi" });
    }
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
          slug: 1,
          name: 1,
          questions: 1,
          maxTimes: 1,
          tracking: 1,
          attemptsAllowed: 1,
        });
      let { questions, startTime, maxTimes, ...data } = exam._doc;
      questions = questions.map((item) => item.question);

      if (!exam) res.status(200).json({ message: "invalid" });

      const takeExam = await TakeExam.find({ userId: user.id, examId: exam.id });
      ///kiểm tra hợp lệ
      if (takeExam.length === 0)
        return res.status(200).json({ message: "checkpin" });

      const lastTakeExam = takeExam[takeExam.length - 1];
      const remainTime = moment(lastTakeExam.startTime)
        .add(exam.maxTimes, "minutes")
        .diff(new Date(), "minutes");
      if (exam.attemptsAllowed === 0) {
        if (lastTakeExam.status === STATUS.SUBMITTED)
          return res.status(200).json({ message: "checkpin" });
      } else {
        if (takeExam.length === exam.attemptsAllowed) {
          if (lastTakeExam.status === STATUS.SUBMITTED)
            return res.status(200).json({ message: "invalid" }); //take exam cuối cùng đã hết thời gian
          if (remainTime < 0)
            return res.status(200).json({ message: "invalid" }); //take exam cuối cùng đã hết thời gian
        } else if (takeExam.length > exam.attemptsAllowed)
          return res.status(200).json({ message: "invalid" }); //take exam cuối cùng đã hết thời gian
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
        });
      let { questions, startTime, maxTimes, ...data } = exam._doc;
      let endTime = moment(new Date()).add(maxTimes, "minutes").toDate();
      questions = questions.map((item) => item.question);

      if (exam.pin !== pin)
        return res.status(400).json({ message: "Sai mật khẩu!" });

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

      if ((new Date(toDay)) < (new Date(course.startTime)) || (new Date(toDay)) > (new Date(course.endTime))){
      console.log(toDay)
      return res.status(400).json({
          message: "Thời gian thực hiện bài thi không hợp lệ"
        })}
      // const takeExams = TakeExam.find({})  
      // const countTakeExam = takeExam.length - 1;
      // if (countTakeExam > exam.attemptsAllowed)
      //   return res.status(400).json({
      //     message: "Đã quá số lần làm bài"
      //   })
      const newTakeExam = new TakeExam({
        examId: exam.id,
        userId: user.id,
      });
      let error = newTakeExam.validateSync();
      if (error) {
        console.log(error);
        return res.status(400).json({
          message: "Làm bài thi thất bại!",
        });
      }
      const takeExam = await newTakeExam.save();
      const newExamResult = new ExamResult({ takeExamId: takeExam.id });
      await newExamResult.save();
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
            question: mongoose.Types.ObjectId(item.question),
            answers
          }
        }
        catch {
          return null
        }
      })
      result = result.filter(e => e !== null)
      await ExamResult.updateOne({ takeExamId: takeExam.id }, { result })
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
    // query:{takeExamId},
    // trả về thông tin của TakeExam như số điểm/điểm tối đa, lần thi thứ mấy, tên bài kiểm tra
    // dựa vào thông tin cho phép xem điểm hay không để quyết định có trả về điểm hay ko, nếu ko trả điểm thì trả thêm mục viewPoints: 'no' hoặc 'alldone'
    try {
      const { takeExamId } = req.query;
      const username = req.user.sub;
      if (!username)
        return res.status(400).json({ message: "Không có người dùng" });
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });
      const takeExam = await TakeExam.findById(takeExamId).populate('examId')
      const takeExams = await TakeExam.find({ examId: takeExam.examId.id, userId: user.id })
      const index = takeExams.findIndex(item => item.id.toString() === takeExamId)
      if (!takeExam) return res.status(400).json({ message: "Không có lịch sử làm bài!" })
      if (takeExam.examId.viewPoint === 'no')
        return res.status(200).json({
          name: takeExam.examId.name,
          lanThi: index,
         
        })
      return res.status(200).json({
        name: takeExam.examId.name,
        lanThi: index,
        points: takeExam.points,
        maxPoints:takeExam.examId.maxPoints
      })
    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi hiện điểm" });
    }
  },


  getPreviewExam: async (req, res) => {
    // api getPreviewExam:{
    //     query:{takeExamId},
    //     yêu cầu:
    //     + Nếu bài thi cho phép xem đáp án
    //     trả về lỗi khi:
    //     + Không cho phép xem điểm, tất cả chưa làm xong
    //     trả về thông tin takeExam và danh sách câu trả lời ở result trên bảng takeResult, ghép 2 bảng này lại theo dạng
    //     questions:{
    //         id,
    //         content,
    //         type,
    //         answers,
    //         choose (lấy từ result ghép vào từng question theo question id, cái nào ko có  để [])
    //     }
    // },
    try {
      const { takeExamId } = req.query;
      const username = req.user.sub;
      if (!username)
        return res.status(400).json({ message: "Không có người dùng" });
      const user = await User.findOne({ username });
      if (!user) return res.status(400).json({ message: "Không có người dùng" });
      const examResult = await ExamResult.findOne({ takeExamId: mongoose.Types.ObjectId(takeExamId) })
        .populate('takeExamId')
      const exam = await Exam.findById(examResult.takeExamId.examId)
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

    }
    catch (error) {
      console.log(error);
      res.status(400).json({ message: "Lỗi hiện điểm" });
    }

  },
  createLogs: async (req, res) => {

  }
};

module.exports = { TakeExamController };
