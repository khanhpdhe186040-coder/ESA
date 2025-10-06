const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const slotSchema = new Schema(
  {
    from: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    to: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
  },
  {
    timestamps: true,
  }
);

// Validate that 'to' time is after 'from' time
slotSchema.pre("save", function (next) {
  if (this.from >= this.to) {
    return next(new Error("End time must be after start time"));
  }
  next();
});

module.exports = mongoose.model("Slot", slotSchema);
