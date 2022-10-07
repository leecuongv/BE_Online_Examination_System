const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Exam = require("../models/Exam");
const TakeExam = require("../models/TakeExam");

const verifyToken = require("../controllers/middlewareController");
const dotenv = require("dotenv");
const { ROLES } = require("../utils/enum");
const { STATUS } = require("../utils/enum");
const { formatTimeUTC } = require("../utils/Timezone");
const TakeExamLogs = require("../models/TakeExamLogs");

router.get("/:takeExamId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const takeExam = await TakeExam.findById(req.params.takeExamId)
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt"
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt -password"
      })
      .populate({
        path: 'chooseAnswers',
        populate: {
          path: 'question',
          select: "-__v -createdAt -updatedAt"
        }
      })
      .exec();

    if (takeExam) {
      res.json({
        success: true,
        message: "Get take exam by id successfully ",
        data: takeExam,
      });
    } else {
      res.json({
        success: false,
        message: "Take exam does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/exam/:testId/:userId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const takeExam = await TakeExam.find({
      exam: req.params.testId,
      user: req.params.userId
    })
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt"
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt -password"
      })
      .populate({
        path: 'chooseAnswers',
        populate: {
          path: 'question',
          select: "-__v -createdAt -updatedAt"
        }
      })
      .exec();

    if (takeExam) {
      res.json({
        success: true,
        message: "Get take exam by testId and UserId successfully ",
        data: takeExam,
      });
    } else {
      res.json({
        success: false,
        message: "Take exam does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/exam/:testId/:userId/lastest", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const takeExam = await TakeExam.find({
      exam: req.params.testId,
      user: req.params.userId
    })
      .sort({createdAt: -1, takeExamId: -1})
      .limit(1)
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt"
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt -password"
      })
      .exec();

    if (takeExam) {
      res.json({
        success: true,
        message: "Get lastest take exam by testId and UserId successfully ",
        data: takeExam,
      });
    } else {
      res.json({
        success: false,
        message: "Lastest take exam does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/takeExam/:takeExamId/logs
//@desc get take exam logs by id
//@access private
//@role admin/creator/user
router.get("/:takeExamId/logs", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const takeExamLogs = await TakeExamLogs.findOne({
      takeExam: req.params.takeExamId
    })
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt"
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt -password"
      })
      .exec();

    if (takeExamLogs) {
      res.json({
        success: true,
        message: "Get take exam logs by id successfully ",
        data: takeExamLogs,
      });
    } else {
      res.json({
        success: false,
        message: "Take exam logs does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Tính điểm mà user đạt được cho mỗi câu hỏi
 * @param {*} choose đối tương lưu answers mà user chọn tương ứng với question
 * @returns số điểm mà user đạt được cho câu hỏi tương ứng
 */
const isCorrectAnswer = (choose) => {
  const answers = choose.answers
  const correctAnswers = choose.question.correctAnswers

  // Nếu chọn nhiều hoặc ít hơn số đáp án đúng, thì chắc chắn không có điểm
  if (answers.length !== correctAnswers.length) {
    return 0
  }

  const num = answers.filter(c => correctAnswers.includes(c)).length
  return num === correctAnswers.length ? 1 : 0
}

/**
 * Tính tổng điểm cho bài thi của user
 * @param {*} chooseAnswers danh sách các câu trả lời của user
 * @returns số điểm mà user đạt được cho bài thi
 */
const calcExamPoints = (chooseAnswers, maxPoints) => {
  let isCorrect = []
  for (let i = 0; i < chooseAnswers.length; i++) {
    const p = isCorrectAnswer(chooseAnswers[i])
    isCorrect.push(p > 0)
  }

  const numCorrectAnswers = isCorrect.filter(Boolean).length

  return {
    points: numCorrectAnswers * (maxPoints / chooseAnswers.length),
    isCorrect: isCorrect,
    isPassed: numCorrectAnswers >= chooseAnswers.length / 2
  }
}

//@route Post v1/takeExam/new
//@desc Create a take exam
//@access public
//@role user
router.post("/", verifyToken, async (req, res) => {
  try {
    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    //Create new
    let take_test = new TakeExam({
      exam: req.body.exam,
      user: req.body.user,
      chooseAnswers: req.body.chooseAnswers,
      points: 0,
      _status: req.body._status,
      questionsOrder: req.body.questionsOrder,
    });

    //Send to Database
    take_test = await take_test.save();

    //Populate để lấy dữ liệu các trường tương ứng
    // let tmp = await TakeExam.findById(take_test._id)
    //   .populate({
    //     path: 'chooseAnswers',
    //     populate: {
    //       path: 'question',
    //       select: "-__v -createdAt -updatedAt -correctAnswers"
    //     }
    //   })
    //   .exec();

    let take_test_logs = new TakeExamLogs({
      exam: req.body.exam,
      user: req.body.user,
      takeExam: take_test._id,
      logs: [
        {
          action: 'Tham gia làm bài'
        }
      ],
      status: 'Ok'
    })

    take_test_logs = await take_test_logs.save();

    res.json({
      success: true,
      message: "Take exam created successfully",
      takeExamId: take_test._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route PUT v1/takeExam/:takeExamId
//@desc Update takeExam
//@access private
//@role admin/creator/user
router.put("/:takeExamId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    let takeExam = {
      exam: req.body.exam,
      questionsOrder: req.body.questionsOrder,
      chooseAnswers: req.body.chooseAnswers,
      updatedAt: new Date(), //formatTimeUTC(),
      _status: req.body._status
    };

    const updateTakeExam = await TakeExam.findByIdAndUpdate(
      req.params.takeExamId,
      takeExam,
      { new: true }
    );

    // Update: add logs
    let takeExamLogs = await TakeExamLogs.findOne({
      takeExam: req.params.takeExamId
    })
    if (takeExamLogs) {
      takeExamLogs.logs.push({
        action: req.body.action
      });
      takeExamLogs = await TakeExamLogs.findByIdAndUpdate(takeExamLogs.id, takeExamLogs, { new: true })
    }

    res.json({
      success: true,
      message: "Update takeExam successfully",
      takeExam: updateTakeExam,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route PUT v1/takeExam/:takeExamId/submit
//@desc Submit takeExam
//@access private
//@role admin/creator/user
router.put("/:takeExamId/submit", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.USER
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const takeExam = await TakeExam.findById(req.params.takeExamId)
      .populate("exam")
      .populate({
        path: "chooseAnswers",
        populate: {
          path: "question"
        }
      }).exec();

    const { points, isCorrect, isPassed } = calcExamPoints(
      takeExam.chooseAnswers,
      takeExam.exam.maxPoints
    );

    let newTakeExam = {
      points: points,
      isCorrect: isCorrect,
      updatedAt: new Date(), //formatTimeUTC(),
      submitTime: req.body.endTime,
      _status: isPassed ? STATUS.PASSED : STATUS.FAILED
    };

    const updateTakeExam = await TakeExam.findByIdAndUpdate(
      req.params.takeExamId,
      newTakeExam,
      { new: true }
    )

    // Update: add logs
    let takeExamLogs = await TakeExamLogs.findOne({
      takeExam: req.params.takeExamId
    })
    if (takeExamLogs) {
      takeExamLogs.logs.push({
        action: 'Submit'
      });
      takeExamLogs = await TakeExamLogs.findByIdAndUpdate(takeExamLogs.id, takeExamLogs, { new: true })
    }

    res.json({
      success: true,
      message: "Update takeExam successfully",
      takeExam: updateTakeExam,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/takeExam/user/:userId
//@desc Get all take exam of a user
//@access public
//@role any
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    //Check permission

    let take_tests = [];
    take_tests = await TakeExam.find({ user: req.params.userId })
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt",
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt",
      })
      .populate({
        path: 'chooseAnswers',
        populate: {
          path: 'question',
          select: "-__v -createdAt -updatedAt"
        }
      })
      .exec();

    res.json({
      success: true,
      message: "Get take_tests successfully",
      takeExams: take_tests,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/takeExam/user/:userId
//@desc Get all take exam by testId
//@access public
//@role any
router.get("/exam/:testId", verifyToken, async (req, res) => {
  try {
    //Check permission

    let take_tests = [];
    take_tests = await TakeExam.find({ exam: req.params.testId })
      .populate({
        path: 'exam',
        select: "-__v -createdAt -updatedAt",
      })
      .populate({
        path: 'user',
        select: "-__v -createdAt -updatedAt",
      })
      .populate({
        path: 'chooseAnswers',
        populate: {
          path: 'question',
          select: "-__v -createdAt -updatedAt"
        }
      })
      .exec();

    res.json({
      success: true,
      message: "Get take_tests successfully",
      takeExams: take_tests,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
