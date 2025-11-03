const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    courseId: {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    material: {
      url: { type: String },
      publicId: { type: String },
    },
    schedule: [
      {
        weekday: {
          type: String,
      
        },
        slot: {
          type: Types.ObjectId,
          ref: "Slot",
          
        },
        room: {
          type: Types.ObjectId,
          ref: "Room",
        
        },
      },
    ],
    status: {
      type: String,
      enum: ["ongoing", "finished", "cancelled"],
      default: "ongoing",
      required: true,
    },
    teachers: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    students: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Class", classSchema);
