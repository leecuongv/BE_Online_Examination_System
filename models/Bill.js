const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { STATUS, COLLECTION } = require("../utils/enum");

const billSchema = mongoose.Schema({
    billId: {
        type: Number,
        require: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: COLLECTION.USER,
    },
    amount: {
        type: Number,
        default: null,
    },
    _status: {
        type: String,
        default: STATUS.FAILED
    },
    createdAt: {
        type: Date,
        default: new Date(),
    },
    updatedAt: {
        type: Date,
        default: new Date()
    },
});

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

module.exports = mongoose.model(COLLECTION.BILL, billSchema);
