const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const scheduleSchema = new Schema(
  {
    slotId: {
      type: Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    classId: {
      type: Types.ObjectId,
      ref: "Class",
      required: true,
    },
    roomId: {
      type: Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedules", scheduleSchema);
