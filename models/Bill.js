const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS, COLLECTION } = require("../utils/enum");

const billSchema = mongoose.Schema({
    billId: {
        type: Number,
        require: true,
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: COLLECTION.USER,
    },
    amount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        default: STATUS.FAILED
    },
    description:{
        type:String,
        require:true,
        default:""
    },
    method:{
        type: String,
        require:true,
    },
    transactionId:{
        type: String,
        require:true,
        default:""
    }

},
{timestamps: true});

billSchema.plugin(
    autoinc.autoIncrement,
    {
        model: COLLECTION.BILL,
        field: "billId"
    }
);

billSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});
const Bill = mongoose.model(COLLECTION.BILL, billSchema);
module.exports = Bill
