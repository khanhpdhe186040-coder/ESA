const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    available: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["classroom", "meeting room", "auditorium"],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);
