import mongoose from "mongoose";
import autoinc from "mongoose-plugin-autoinc";
import { COLLECTION, DEFAULT_VALUES } from "../utils/enum.js";

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
    unique:true,
    default: "",
  },
  exams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.TEST
    }
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.USER
    }
  ],
  status: {
    type: String,
    default: "",
  },

  image:
  {
    type: String,
    default: DEFAULT_VALUES.IMAGE_COURSE,
  },

},
  { timestamps: true }
);

courseSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.COURSE,
    field: 'courseId'
  }
);

courseSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

export const Course = mongoose.model(COLLECTION.COURSE, courseSchema);
