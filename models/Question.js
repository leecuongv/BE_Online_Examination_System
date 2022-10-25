const mongoose =require("mongoose");
const autoinc =require("mongoose-plugin-autoinc");
const { formatTimeUTC } =require("../utils/Timezone");
const { COLLECTION } =require("../utils/enum");

const questionSchema = mongoose.Schema({
   type: {
    type: String,
    require: true,
    default: 'single',
  },
  content: {
    type: String,
    require: true,
    default: '',
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



questionSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

const Question = mongoose.model(COLLECTION.QUESTION, questionSchema);

module.exports = Question
