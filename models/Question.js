const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION, QUESTIONTYPE } = require("../utils/enum");
const Answer = require("./Answer");

const questionSchema = mongoose.Schema({
  type: {
    type: String,
    require: true,
    default: QUESTIONTYPE.SINGLE,
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
  image: {
    type: String,
    default: "",
  },
  maxPoints: {
    type: Number,
    default: 1,
  }, 
},
  {
    timestamps: true, toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id
        // delete ret._id;
      }
    }
  });


questionSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});
questionSchema.pre('deleteOne', { query: true, document: true }, async function (next) {
  // 'this' is the client being removed. Provide callbacks here if you want
  // to be notified of the calls' result.
  try {
    const answers = this.answers
    answers.forEach(async (item) => {
      await Answer.findByIdAndDelete(item)
    })
  }
  catch (err) {
    console.log(err)
  }
  finally {
    next();
  }


});
const Question = mongoose.model(COLLECTION.QUESTION, questionSchema);

module.exports = Question
