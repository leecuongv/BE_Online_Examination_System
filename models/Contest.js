const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION } = require("../utils/enum");

const contestSchema = mongoose.Schema({
  contestId: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
    default: null,
  },
  description: {
    type: String,
    require: true,
    default: null,
  },
  startTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },

  endTime: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: COLLECTION.USER,
  },
  url: {
    type: String,
    default: null,
  },
  tests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: COLLECTION.TEST,
      default: null,
    },
  ],
  _status: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: new Date()// formatTimeUTC,
  },
  updatedAt: {
    type: Date,
    default: new Date()//formatTimeUTC,
  },
  embededMedia:
  {
    type: String,
    default: null,
  },

});

contestSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.CONTEST,
    field: 'contestId'
  }
);

contestSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.CONTEST, contestSchema);
