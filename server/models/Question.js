const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const questionSchema = new Schema({
    quizId: { type: Types.ObjectId, ref: 'Quiz', required: true },
    questionText: { type: String, required: true },
    type: { type: String, default: 'multiple-choice' }
});
module.exports = mongoose.model("Question", questionSchema);