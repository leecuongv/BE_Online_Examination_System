const express = require("express");
const router = express.Router();
const verifyToken = require("../controllers/middlewareController");
const dotenv = require("dotenv");
const { ROLES, STATUS, COLLECTION } = require("../utils/enum");
dotenv.config({ path: "./.env" });
const Course = require("../models/Course")
const TakeExam = require("../models/TakeExam")
const { formatTimeUTC_, formatTimeUTC } = require("../utils/Timezone");
const TextUtils = require("../utils/TextUtils");

router.get("/creator/:creatorId", verifyToken, async (req, res) => {
  try {
    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const courses = await Course.find({ creatorId: req.params.creatorId });
    if (courses) {
      res.json({
        success: true,
        message: "Get all course successfully ",
        courses,
      });
    } else {
      res.json({
        success: false,
        message: "Courses do not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("", verifyToken, async (req, res) => {
  try {
    //Check permission
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

    const courses = await Course.find({ _status: STATUS.OK });
    if (courses) {
      res.json({
        success: true,
        message: "Get all course successfully ",
        courses,
      });
    } else {
      res.json({
        success: false,
        message: "Courses do not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/all", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const courses = await Course.find();
    if (courses) {
      res.json({
        success: true,
        message: "Get all course successfully ",
        courses,
      });
    } else {
      res.json({
        success: false,
        message: "Courses do not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:contestIdOrUrl", verifyToken, async (req, res) => {
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

    var course = null;
    try {
      course = await Course.findById(req.params.contestIdOrUrl).populate("exams");
    }
    catch {
      const url = `/${COLLECTION.CONTEST}/${req.params.contestIdOrUrl}`
      course = await Course.findOne({ url }).populate("exams");
    }

    if (course) {
      res.json({
        success: true,
        message: "Get course by id successfully ",
        data: course,
      });
    } else {
      res.json({
        success: false,
        message: "Course does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route GET v1/courses/:contestId/exams
//@desc get all exams of the course
//@access private
//@role admin/creator
router.get("/:contestId/exams", verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.contestId).populate(
      "exams"
    );
    if (course) {
      res.json({
        success: true,
        message: "Get all exams by course id successfully ",
        exams: course.exams,
      });
    } else {
      res.json({
        success: false,
        message: "Exams does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get All TakeExams by CourseId for Creator/Admin
const getAllTakeExamsInCourse = async (exams) => {
  var takeExams = []

  for (let testId of exams) {
    const t = await TakeExam.find({ exam: testId })
      .populate("exam")
      .populate("user")
      .then(data => data)

    takeExams = takeExams.concat(t);
  }

  return takeExams
}

//@route GET v1/courses/:contestId/taketests
//@desc get all taketests of the course
//@access private
//@role admin/creator
router.get("/:contestId/taketests", verifyToken, async (req, res) => {
  try {
    if (
      !(
        req.body.verifyAccount.role === ROLES.CREATOR ||
        req.body.verifyAccount.role === ROLES.ADMIN
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    const course = await Course.findById(req.params.contestId);
    const takeExams = await getAllTakeExamsInCourse(course.exams)

    if (course) {
      res.json({
        success: true,
        message: "Get all takeExams by course id successfully ",
        takeExams: takeExams,
      });
    } else {
      res.json({
        success: false,
        message: "Exams does not exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//TODO: Get all exams of  a exam by testId for isHidden = false OR true

//@route Exam v1/course
//@desc Create a course
//@access private
//@role admin/creator
router.post("", verifyToken, async (req, res) => {
  try {
    //Check permission

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    //Create new course
    let course = new Course({
      name: req.body.name,
      creatorId: req.body.creatorId,
      description: req.body.description,
      exams: req.body.exams, // can null
      startTime: new Date(req.body.startTime), //formatTimeUTC_(req.body.startTime),
      endTime: new Date(req.body.endTime), //formatTimeUTC_(req.body.endTime),
      url: TextUtils.makeSlug(COLLECTION.CONTEST, req.body.name),
      embededMedia: req.body.embededMedia,
      isHidden: false
    });

    //Send to Database
    course = await course.save();


    res.json({
      success: true,
      message: "Course created successfully",
      course: course,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route Exam v1/courses/:contestId/exams
//@desc update/create new exams for course
//@access private
//@role admin/creator
router.put("/:contestId/exams", verifyToken, async (req, res) => {
  try {
    //Check permission

    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    //update new course
    let course = await Course.findByIdAndUpdate(req.params.contestId,
      {
        exams: req.body.exams, updatedAt: formatTimeUTC()
      },
      { new: true })
      .populate("exams")
      .exec();

    res.json({
      success: true,
      message: "Course updated successfully",
      course: course,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//@route PUT v1/courses/:contestId
//@desc Update a course by course Id
//@access private
//@role admin/creator
router.put("/:contestId", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    let course = {
      name: req.body.name,
      creatorId: req.body.creatorId,
      description: req.body.description,
      exams: req.body.exams, // can null
      startTime: new Date(req.body.startTime), //formatTimeUTC_(req.body.startTime),
      endTime: new Date(req.body.endTime), //formatTimeUTC_(req.body.endTime),
      isHidden: false,
      embededMedia: req.body.embededMedia,
      updatedAt: new Date(), // formatTimeUTC(),
      _status: req.body._status
    };

    if (req.body.url) {
      course.url = TextUtils.makeSlug(COLLECTION.CONTEST, req.body.url, false)
    }
    else {
      const {url: oldUrl} = await Course.findById(req.params.contestId).select("url").exec();
      course.url = oldUrl;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.contestId,
      course,
      { new: true }
    ).populate("exams").exec();

    res.json({
      success: true,
      message: "Update course successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


//@route PUT v1/courses/:contestId/archive
//@desc Archive a course by course Id
//@access private
//@role admin/creator
router.put("/:contestId/archive", verifyToken, async (req, res) => {
  try {
    //Check permission
    if (
      !(
        req.body.verifyAccount.role === ROLES.ADMIN ||
        req.body.verifyAccount.role === ROLES.CREATOR
      )
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Permission denied" });
    }

    if (!req.body)
      res.status(400).json({
        success: false,
        message: "Body request not found",
      });

    const deletedCourse = await Course.findByIdAndUpdate(
      req.params.contestId,
      {
        _status: STATUS.ARCHIVED,
        updatedAt: new Date(),// formatTimeUTC()
      },
      { new: true }
    )
      .populate("exams").exec();

    res.json({
      success: true,
      message: "Archive course successfully",
      course: deletedCourse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


module.exports = router;
