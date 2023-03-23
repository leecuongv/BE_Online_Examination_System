const mongoose = require("mongoose");
const autoinc = require("mongoose-plugin-autoinc");
const { formatTimeUTC } = require("../utils/Timezone");
const { COLLECTION, STATUS } = require("../utils/enum");

const seenLessonSchema = mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.LESSON,
  },
  creatorId: {
    type: mongoose.SchemaTypes.ObjectId,
    require: true,
    default: null,
    ref: COLLECTION.USER,
  },
},
  { timestamps: true });


seenLessonSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});

const SeenLesson = mongoose.model(COLLECTION.SEENLESSON, seenLessonSchema);
module.exports = SeenLesson