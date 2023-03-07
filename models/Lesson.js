const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { COLLECTION, VIEWPOINT, STATUS } = require("../utils/enum");

const lessonSchema = mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
            default: "Bài tập về nhà",
        },
        content: {
            type: String,
            default: false
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        startTime: {
            type: Date,
            default: new Date()//formatTimeUTC,
        },
        endTime: {
            type: Date,
            default: new Date()//formatTimeUTC,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        slug: {
            type: Number,
            require: true,
        },
        file: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            default: STATUS.PUBLIC,
        },
    },
    {
        timestamps: true,
        toObject: {
            transform: function (doc, ret) {
                ret.id = ret._id
                delete ret._id;
            }
        }
    },

);

lessonSchema.method("toJSON", function () {
    const { __v, ...object } = this.toObject();
    return object;
});

lessonSchema.plugin(
    autoinc.autoIncrement,
    {
        model: COLLECTION.LESSON,
        field: "slug"
    }
);
const Lesson = mongoose.model(COLLECTION.LESSON, lessonSchema);
module.exports = Lesson 