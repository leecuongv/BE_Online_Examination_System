const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { COLLECTION, VIEWPOINT, STATUS } = require("../utils/enum");

const assignmentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      default: "Bài tập về nhà",
    },
    content: {
      type: String,
      default: false
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    startTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    endTime: {
      type: Date,
      default: new Date()//formatTimeUTC,
    },
    viewPoint: {
      type: String,
      require: true,
      default: VIEWPOINT.NO,
    },
    maxPoints: {
      type: Number,
      require: true,
      default: 1,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    slug: {
      type: Number,
      require: true,
      isUnique: true
    },
    allowReSubmit: {
      type: Boolean,
      default: false
    },
    allowSubmitLate: {
      type: Boolean,
      default: false
    },
    file: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: STATUS.PUBLIC,
    },
    toPass: {
      type: Number,
      default: 50
    }
  },
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id;
      }
    }
  },

);

assignmentSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});

assignmentSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.ASSIGNMENT,
    field: "slug"
  }
);
const Assignment = mongoose.model(COLLECTION.ASSIGNMENT, assignmentSchema);
module.exports = Assignment 