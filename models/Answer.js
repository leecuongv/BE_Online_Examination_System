import mongoose from "mongoose";
import autoinc from "mongoose-plugin-autoinc";
import { formatTimeUTC } from "../utils/Timezone.js";
import { COLLECTION } from "../utils/enum.js";

const answerSchema = mongoose.Schema({
  answerId: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
    default: 0,
  },
  content: {
    type: String,
    require: true,
    default: null,
  },
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
    default: new Date()// formatTimeUTC,
  },
});

answerSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.ANSWER,
    field: 'answerId'
  }
);

answerSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

export const Answer = mongoose.model(COLLECTION.ANSWER, answerSchema);
