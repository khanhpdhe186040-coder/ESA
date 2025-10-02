const mongoose = require('mongoose');
const Quiz = require("../models/Quiz"); // Bạn cần tạo model này
const Question = require("../models/Question");
const Answer = require("../models/Answer");

// 1. Lấy quiz ID từ course ID
exports.getQuizByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quiz = await Quiz.findOne({ courseId }).lean();
    if (!quiz) {
      return res.status(404).json({ message: "No quiz found for this course." });
    }
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Lấy 10 câu hỏi ngẫu nhiên
exports.getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    // Sử dụng aggregation pipeline của MongoDB để lấy 10 câu hỏi ngẫu nhiên
    const questions = await Question.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
      { $sample: { size: 10 } },
    ]);

    // Lấy các câu trả lời cho những câu hỏi đã chọn
    const questionIds = questions.map(q => q._id);
    const answers = await Answer.find({ questionId: { $in: questionIds } }).select("-isCorrect"); // Không gửi đáp án đúng cho client

    // Gộp câu trả lời vào câu hỏi tương ứng
    const populatedQuestions = questions.map(question => ({
      ...question,
      answers: answers.filter(a => a.questionId.toString() === question._id.toString()),
    }));

    res.status(200).json(populatedQuestions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Chấm điểm bài làm
exports.submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const userAnswers = req.body.answers; // Expects an array like [{ questionId: '...', answerId: '...' }]

        const questionIds = userAnswers.map(ua => ua.questionId);

        // Lấy đáp án đúng từ database
        const correctAnswers = await Answer.find({
            questionId: { $in: questionIds },
            isCorrect: true
        }).lean();

        // Tạo một map để tra cứu nhanh đáp án đúng
        const correctAnswerMap = new Map(
            correctAnswers.map(ans => [ans.questionId.toString(), ans._id.toString()])
        );

        let score = 0;
        const results = userAnswers.map(ua => {
            const isCorrect = correctAnswerMap.get(ua.questionId) === ua.answerId;
            if (isCorrect) {
                score++;
            }
            return {
                questionId: ua.questionId,
                selectedAnswerId: ua.answerId,
                correctAnswerId: correctAnswerMap.get(ua.questionId),
                isCorrect: isCorrect
            };
        });

        res.status(200).json({
            score: score,
            totalQuestions: userAnswers.length,
            results: results
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.checkAnswer = async (req, res) => {
    try {
        const { questionId, answerId } = req.body;

        // Tìm câu trả lời mà người dùng đã chọn
        const selectedAnswer = await Answer.findById(answerId).lean();
        if (!selectedAnswer) {
            return res.status(404).json({ message: 'Answer not found.' });
        }

        // Tìm đáp án đúng của câu hỏi đó để so sánh và trả về cho client
        const correctAnswer = await Answer.findOne({ questionId: questionId, isCorrect: true }).lean();
        
        res.status(200).json({
            isCorrect: selectedAnswer.isCorrect,
            correctAnswerId: correctAnswer._id
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};