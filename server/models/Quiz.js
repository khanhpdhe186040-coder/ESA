const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const quizSchema = new Schema({
    courseId: { type: Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: String,
    timeLimit: { type: Number, required: true }, // in minutes
    teacherId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
});
module.exports = mongoose.model("Quiz", quizSchema);



