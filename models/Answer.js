const mongoose =require("mongoose")
const autoinc =require("mongoose-plugin-autoinc")
const { formatTimeUTC } =require("../utils/Timezone")
const { COLLECTION } =require("../utils/enum")

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

const Answer = mongoose.model(COLLECTION.ANSWER, answerSchema);
module.exports = {Answer}