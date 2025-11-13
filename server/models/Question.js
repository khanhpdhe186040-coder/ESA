const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    quizId: {
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'multiple-choice'
    }
}, {
    timestamps: true 
}); 

module.exports = mongoose.model('Question', questionSchema);