const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    number: {
      type: String,
      required: true,
    },
    birthday: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    imagePublicId: { 
      type: String, 
      default: null, 
    },
    roleId: {
      type: String,
      ref: "Role",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);