const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const answerSchema = new Schema({
    questionId: { type: Types.ObjectId, ref: 'Question', required: true },
    answerText: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
});
module.exports = mongoose.model("Answer", answerSchema);