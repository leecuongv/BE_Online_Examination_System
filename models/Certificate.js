const mongoose = require("mongoose")
const autoinc = require("mongoose-plugin-autoinc")
const { COLLECTION, DEFAULT_VALUES, STATUS } = require("../utils/enum")

const certificateSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: COLLECTION.USER,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    file: {
        type: String,
        default: null
    },
    slug: {
        type: String,
        require: true,
    },



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

certificateSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});
const Certificate = mongoose.model(COLLECTION.CERTIFICATE, certificateSchema);
module.exports = Certificate
