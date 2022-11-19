const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION, STATUS } = require("../utils/enum");

const submitAssigmentSchema = mongoose.Schema({
  assigmentId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.EXAM,
  },
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.USER,
  },
  content:{
    type: String,
    default:""
  },
  submitTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  file:{
    type: String,
    default:""
  },
  points: {
    type: Number,
    default: 0,
  },  
},
  { timestamps: true });


  submitAssigmentSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

const SubmitAssignment =  mongoose.model(COLLECTION.SUBMITASSIGNMEMT, submitAssigmentSchema);
module.exports = SubmitAssignment