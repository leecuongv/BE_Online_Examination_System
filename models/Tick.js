const mongoose = require("mongoose")
const autoinc = require("mongoose-plugin-autoinc")
const { COLLECTION, DEFAULT_VALUES } = require("../utils/enum")

const tickSchema = mongoose.Schema({
  tickId: {
    type: Number,
    require: true,
  },
  date: {
    type: Date,
    
  },
  activity: [{
    title:{
        type: String,
    },
    url:{
        type: String,
        default: ""
    }

  }],
  

},
  {
    timestamps: true,
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id
        //delete ret._id;
      }
    }
  }
);

tickSchema.plugin(
  autoinc.autoIncrement,
  {
    model: COLLECTION.TICK,
    field: 'tickId'
  }
);

tickSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Tick = mongoose.model(COLLECTION.TICK, tickSchema);
module.exports = Tick
