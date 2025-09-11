const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const gradeSchema = new Schema(
  {
    studentId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: Types.ObjectId,
      ref: "Class",
      required: true,
    },
    score: {
      listening: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      reading: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      writing: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      speaking: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Grade", gradeSchema);
