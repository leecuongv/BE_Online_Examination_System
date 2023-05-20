const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS, COLLECTION } = require("../utils/enum");

const transactionHistorySchema = mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: COLLECTION.USER,
    },
    bank: {
        type: String,
    },
    creditNumber: {
        type: String
    },
    feeIn: {
        type: Boolean,
        default: true,
    },
    amount: {
        type: Number,
        default: 0,
    },
    fee: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: STATUS.FAILED
    },
    description: {
        type: String,
        require: true,
        default: ""
    },
    transactionId: {
        type: String,
        require: true,
        default: ""
    },
    isTransferred: {
        type: Boolean,
        require: true,
        default: false,

    }
    //bank, creditNumber, amount, password, feeIn 
},
    { timestamps: true });

transactionHistorySchema.plugin(
    autoinc.autoIncrement,
    {
        model: COLLECTION.TRANSACTIONHISTORY,
        field: "transactionId"
    }
);
transactionHistorySchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});
const TransactionHistory = mongoose.model(COLLECTION.TRANSACTIONHISTORY, transactionHistorySchema);
module.exports = TransactionHistory
