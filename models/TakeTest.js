const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION } = require("../utils/enum");

const takeTestSchema = mongoose.Schema({
  takeTestId: {
    type: Number,
    require: true,
  },
  test: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: "tests",
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: "users",
  },
  submitTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  questionsOrder: [String],
  chooseAnswers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTION.QUESTION,
        default: null,
      },
      answers: [String]
    },
  ],
  isCorrect: [Boolean],
  points: {
    type: Number,
    default: 0,
  },
  _status: {
    type: String,
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

takeTestSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.TAKETEST,
    field: "takeTestId"
  }
);

takeTestSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.TAKETEST, takeTestSchema);
