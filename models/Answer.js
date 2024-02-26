const mongoose = require("mongoose")
const autoinc = require("mongoose-plugin-autoinc")
const { formatTimeUTC } = require("../utils/Timezone")
const { COLLECTION, ANSWERTYPE } = require("../utils/enum")

const answerSchema = mongoose.Schema({
  content: {
    type: String,
    require: true,
    default: '',
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: ANSWERTYPE.EQUAL
  }
},
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id;
      }
    },
  });

answerSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});

const Answer = mongoose.model(COLLECTION.ANSWER, answerSchema);
module.exports = Answer
