import  mongoose from "mongoose";
import  autoinc from "mongoose-plugin-autoinc";
import  { formatTimeUTC } from "../utils/Timezone.js";
import  { COLLECTION } from "../utils/enum.js";

const questionSchema = mongoose.Schema({
  // order: {
  //   type: Number,
  //   require: true,
  //   default: 0,
  // },
  questionId: {
    type: Number,
    require: true,
  },
  type: {
    type: String,
    require: true,
    default: null,
  },
  content: {
    type: String,
    require: true,
    default: null,
  },
  answers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.ANSWER,
      default: null,
    },
  ],
  correctAnswers: [
    {
      type: String,
      default: null,
    },
  ],
  embededMedia: {
    type: String,
    default: null,
  },
  _status: {
    type: String,
  },
  maxPoints: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: new Date()//formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: new Date()//formatTimeUTC
  },
});

questionSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.QUESTION,
    field: "questionId"
  }
);

questionSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

export const Question = mongoose.model(COLLECTION.QUESTION, questionSchema);
