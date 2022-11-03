const mongoose =require("mongoose")
const autoinc =require("mongoose-plugin-autoinc")
const { formatTimeUTC } =require("../utils/Timezone")
const { COLLECTION } =require("../utils/enum")

const questionBankSchema = mongoose.Schema({
    name:{
        type: String,
        default: ""
    },
    description:{
        type: String,
        default: ""
    },
    creatorId:{
        type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.USER,
    },
    questions:[{
        type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.QUESTION, 
    }],
    slug:{
      type: Number,

    }
},
{ timestamps: true ,
  toObject: {
    transform: function (doc, ret) {
      ret.id=ret._id
      delete ret._id;
    }
  },});

questionBankSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});
questionBankSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.QUESTIONBANK,
    field: "slug"
  }
)

const QuestionBank = mongoose.model(COLLECTION.QUESTIONBANK, questionBankSchema);
module.exports = QuestionBank
