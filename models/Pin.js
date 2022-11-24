const mongoose =require("mongoose")
const autoinc =require("mongoose-plugin-autoinc")
const { formatTimeUTC } =require("../utils/Timezone")
const { COLLECTION } =require("../utils/enum")

const pinSchema = mongoose.Schema({
  code:[
    {
      type: String,
    }
  ]
},
{ timestamps: true ,
  toObject: {
    transform: function (doc, ret) {
      ret.id=ret._id
    }
  },});

answerSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});

const Pin = mongoose.model(COLLECTION.PIN, answerSchema);
module.exports = Pin
