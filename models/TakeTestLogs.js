const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION } = require("../utils/enum");

const takeTestLogsSchema = mongoose.Schema({
    logId: {
        type: Number,
        require: true,
    },
    test: {
        type: mongoose.SchemaTypes.ObjectId,
        require: true,
        default: null,
        ref: COLLECTION.TEST,
    },
    takeTest: {
        type: mongoose.SchemaTypes.ObjectId,
        require: true,
        default: null,
        ref: COLLECTION.TAKETEST,
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        require: true,
        default: null,
        ref: COLLECTION.USER,
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
    _status: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date()//formatTimeUTC,
    },
    updatedAt: {
        type: Date,
        default: new Date()//formatTimeUTC,
    },
});

takeTestLogsSchema.plugin(
    autoinc.autoIncrement,
    {
        model: COLLECTION.TAKETESTLOG,
        field: "logId"
    }
);

takeTestLogsSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    const { _id: id, ...result } = object;
    return { ...result, id };
});

module.exports = mongoose.model(COLLECTION.TAKETESTLOG, takeTestLogsSchema);
