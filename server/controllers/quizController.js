const mongoose = require('mongoose');
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const Answer = require("../models/Answer");

// === CÁC HÀM PUBLIC CHO STUDENT/GUEST ===

exports.getQuizByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quiz = await Quiz.findOne({ courseId }).lean();
    if (!quiz) return res.status(404).json({ success: false, message: "No quiz found for this course." });
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await Question.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
      { $sample: { size: 10 } },
    ]);
    const questionIds = questions.map(q => q._id);
    const allAnswers = await Answer.find({ questionId: { $in: questionIds } }).lean();
    const populatedQuestions = questions.map(question => {
      const answersForQuestion = allAnswers.filter(a => a.questionId.toString() === question._id.toString());
      const correctAnswerCount = answersForQuestion.filter(a => a.isCorrect).length;
      const sanitizedAnswers = answersForQuestion.map(({ isCorrect, ...rest }) => rest);
      return { ...question, answers: sanitizedAnswers, correctAnswerCount };
    });
    res.status(200).json(populatedQuestions);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.checkAnswer = async (req, res) => {
    try {
        const { questionId, answerIds } = req.body;
        const selectedAnswers = await Answer.find({ _id: { $in: answerIds } }).lean();
        if (selectedAnswers.length !== answerIds.length) {
             return res.status(404).json({ message: 'One or more answers not found.' });
        }
        const correctAnswers = await Answer.find({ questionId: questionId, isCorrect: true }).lean();
        const correctAnswerIds = correctAnswers.map(ans => ans._id.toString());
        const incorrectSelected = selectedAnswers.some(ans => !ans.isCorrect);
        const allCorrectsSelected = correctAnswerIds.length === selectedAnswers.length;
        const isFullyCorrect = !incorrectSelected && allCorrectsSelected;
        res.status(200).json({ isCorrect: isFullyCorrect, correctAnswerIds });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.submitQuiz = async (req, res) => { /* Code của bạn cho submitQuiz */ };

// ==========================================================
// ## CÁC HÀM CHO TEACHER ##
// ==========================================================

// --- Quản lý Quiz ---
exports.getQuizzesByTeacher = async (req, res) => {
    try {
        const quizzes = await Quiz.find({}).populate('courseId', 'name');
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { title, description, courseId, timeLimit } = req.body;
        const teacherId = req.user.id;
        const existingQuiz = await Quiz.findOne({ courseId });
        if (existingQuiz) return res.status(400).json({ success: false, message: 'This course already has a quiz.' });
        const newQuiz = new Quiz({ title, description, courseId, timeLimit, teacherId });
        await newQuiz.save();
        res.status(201).json({ success: true, message: 'Quiz created successfully', data: newQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getQuizDetails = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { title, description, courseId, timeLimit } = req.body;
        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, { title, description, courseId, timeLimit }, { new: true });
        if (!updatedQuiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
        res.status(200).json({ success: true, message: 'Quiz updated successfully', data: updatedQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
        const questions = await Question.find({ quizId: quiz._id }).select('_id');
        const questionIds = questions.map(q => q._id);
        await Question.deleteMany({ quizId: quiz._id });
        await Answer.deleteMany({ questionId: { $in: questionIds } });
        res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Quản lý Question cho Teacher ---
exports.getQuestionsForTeacher = async (req, res) => {
  try {
    const { quizId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalQuestions = await Question.countDocuments({ quizId: new mongoose.Types.ObjectId(quizId) });
    const questions = await Question.find({ quizId: new mongoose.Types.ObjectId(quizId) }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.status(200).json({ success: true, data: questions, currentPage: page, totalPages: Math.ceil(totalQuestions / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.createQuestion = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questionText, answers } = req.body;
        
        // SỬA LỖI: Chuyển đổi quizId (String) thành ObjectId trước khi lưu
        const newQuestion = new Question({ 
            quizId: new mongoose.Types.ObjectId(quizId), // <-- SỬA Ở ĐÂY
            questionText, 
            type: 'multiple-choice' 
        });
        
        await newQuestion.save();
        
        const answersToCreate = answers.map(ans => ({ ...ans, questionId: newQuestion._id }));
        await Answer.insertMany(answersToCreate);
        
        res.status(201).json({ success: true, message: 'Question created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getQuestionDetails = async (req, res) => {
    try {
        const { questionId } = req.params;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
        const answers = await Answer.find({ questionId: questionId });
        res.status(200).json({ success: true, data: { ...question.toObject(), answers } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { questionText, answers } = req.body;
        await Question.findByIdAndUpdate(questionId, { questionText });
        await Answer.deleteMany({ questionId: questionId });
        const answersToCreate = answers.map(ans => ({ ...ans, questionId: questionId }));
        await Answer.insertMany(answersToCreate);
        res.status(200).json({ success: true, message: 'Question updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const question = await Question.findByIdAndDelete(questionId);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
        await Answer.deleteMany({ questionId: questionId });
        res.status(200).json({ success: true, message: 'Question and its answers deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};