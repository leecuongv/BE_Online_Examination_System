const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { COLLECTION } = require("../utils/enum");

const examResultSchema = mongoose.Schema({
    logId: {
        type: Number,
        require: true,
    },
    takeExamId: {
        type: mongoose.SchemaTypes.ObjectId,
        require: true,
        default: null,
        ref: COLLECTION.TAKEEXAM,
    },
    
    logs: [
        {
            time: {
                type: Date,
                default: new Date()//formatTimeUTC,
            },
            action: {
                type: String,
            }
        }
    ],
},
{ timestamps: true,
    toObject: {
        transform: function (doc, ret) {
          ret.id=ret._id
          
        }
      } }
);


examResultSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.EXAMRESULT, examResultSchema);
