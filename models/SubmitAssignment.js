const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION, STATUS } = require("../utils/enum");

const submitAssignmentSchema = mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.ASSIGNMENT,
  },
  creatorId: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.USER,
  },
  content: {
    type: String,
    default: ""
  },
  submitTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  file: {
    type: String,
    default: ""
  },
  points: {
    type: Number,
    default: null,
  },
  isPass: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true });


submitAssignmentSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

const SubmitAssignment = mongoose.model(COLLECTION.SUBMITASSIGNMENT, submitAssignmentSchema);
module.exports = SubmitAssignment