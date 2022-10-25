const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION, STATUS } = require("../utils/enum");

const takeExamSchema = mongoose.Schema({
  takeExamId: {
    type: Number,
    require: true,
  },
  exam: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.EXAM,
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.USER,
  },
  startTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  submitTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  points: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default:STATUS.NOT_SUBMITTED
  },
},
{ timestamps: true });

takeExamSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.TAKEEXAM,
    field: "takeExamId"
  }
);

takeExamSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.TAKEEXAM, takeExamSchema);
