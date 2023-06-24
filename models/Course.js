const mongoose = require("mongoose")
const autoinc = require("mongoose-plugin-autoinc")
const { COLLECTION, DEFAULT_VALUES, STATUS, CERTIFICATION } = require("../utils/enum")

const courseSchema = mongoose.Schema({
  courseId: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
    default: "",
  },
  description: {
    type: String,
    require: true,
    default: "",
  },
  startTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },

  endTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: COLLECTION.USER,
  },
  slug: {
    type: String,
    unique: true,
    default: "",
  },
  exams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.EXAM
    },
  ],

  assignments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.ASSIGNMENT
    },
  ],
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.USER
    }
  ],
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.LESSON
    }
  ],
  status: {
    type: String,
    default: STATUS.PUBLIC,
  },

  image:
  {
    type: String,
    default: DEFAULT_VALUES.IMAGE_COURSE,
  },
  pin: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  isSell: {
    type: Boolean,
    default: false
  },
  certification: {
    type: String,
    default: CERTIFICATION.NOTALLOW
  },
  toPass: {
    type: Number,
    default: 80
  }

},
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id
        //delete ret._id;
      }
    }
  }
);

courseSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.COURSE,
    field: 'courseId'
  }
);

courseSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Course = mongoose.model(COLLECTION.COURSE, courseSchema);
module.exports = Course
