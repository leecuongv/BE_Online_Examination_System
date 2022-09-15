const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION } = require("../utils/enum");

const testSchema = mongoose.Schema(
  {
    testId: {
      type: Number,
      require: true,
    },
    name: {
      type: String,
      require: true,
      default: 0,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      require: true,
      default: null,
    },
    pin: {
      type: String,
      require: true,
      default: null,
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.QUESTION,
      default: null,
    }],
    startTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    endTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    attempts_allowed: {
      type: Number,
      default: null,
    },
    url: {
      type: String,
      default: null,
    },
    maxPoints: {
      type: Number,
      default: null,
    },
    maxTimes: {
      type: Number,
      default: null,
    },
    tracking: [
      {
        type: String,
        default: [],
      },
    ],
    questionsOrder: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.QUESTION,
      default: null,
    }],
    _status: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    updatedAt: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
  });

testSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.TEST,
    field: "testId"
  }
);

testSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.TEST, testSchema);
