const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { COLLECTION, VIEWPOINT, TYPEOFPOINT, VIEWANSWER, STATUS } = require("../utils/enum");

const examSchema = mongoose.Schema(
  {
    slug: {
      type: Number,
      require: true,
    },
    name: {
      type: String,
      require: true,
      default: "Đề thi",
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      require: true,
      default: '',
    },
    pin: {
      type: String,
      require: true,
      default: '',
    },
    questions: [{
      index: {
        type: Number,
        require: true,
        default: 0
      },
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTION.QUESTION,
        default: null,
      }
    }],
    startTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    endTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    numberofQuestions: {
      type: Number,
      require:true,
      default: 0,
    },
    viewPoint: {
      type: String,
      require:true,
      default: VIEWPOINT.NO,
    },
    viewAnswer: {
      type: String,
      require:true,
      default: VIEWANSWER.NO,
    },
    attemptsAllowed: {
      type: Number,
      default: 0,
    },
    maxPoints: {
      type: Number,
      default: 0,
    },
    typeofPoint: {
      type: Number,
      default: TYPEOFPOINT.MAX,
    },
    maxTimes: {
      type: Number,
      require:true,
      default: 1
    },
    tracking: {
      type:Boolean,
      default:true
    },
    shuffle: {
      type:Boolean,
      default:true
    },
    status: {
      type: String,
      default: STATUS.PUBLIC,
    }, 
  },
  { timestamps: true }
  );

examSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.EXAM,
    field: "slug"
  }
);

examSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.EXAM, examSchema);
