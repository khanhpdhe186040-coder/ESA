const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
      // validate: {
      //   validator: function(v) {
      //     return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(v);
      //   },
      //   message: props => `${props.value} is not a valid image URL!`
      // }
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: [true, "Level is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Course || mongoose.model("Course", courseSchema);
