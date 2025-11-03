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

// Index Đảm bảo không trùng lịch (Slot + Room + Date)
scheduleSchema.index({ slotId: 1, roomId: 1, date: 1 }, { unique: true });

// Middleware chuẩn hóa date thành 00:00:00.000Z
scheduleSchema.pre("save", function (next) {
  if (this.isModified('date') || this.isNew) {
    const dateOnly = this.date.toISOString().split('T')[0];
    this.date = new Date(dateOnly);
  }
  next();
});

module.exports = mongoose.model("Schedule", scheduleSchema);