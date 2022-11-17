const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { COLLECTION, VIEWPOINT, TYPEOFPOINT, VIEWANSWER, STATUS } = require("../utils/enum");

const logSchema = mongoose.Schema(
  {
    action:{
        type: String,
        default: false 
    },
    time:{
        type: Date,
        default:  new Date()//formatTimeUTC,
    },
    takeExamId:{
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
  },
  { timestamps: true ,
    toObject: {
      transform: function (doc, ret) {
        ret.id=ret._id
        delete ret._id;
      }
    }},
  
);

logSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});

module.exports = mongoose.model(COLLECTION.LOG, logSchema);