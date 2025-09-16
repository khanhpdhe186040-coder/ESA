const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const chatSchema = new Schema(
  {
    participants: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      messageId: {
        type: Types.ObjectId,
        ref: "Message",
      },
      content: {
        type: String,
      },
      sender: {
        type: Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
