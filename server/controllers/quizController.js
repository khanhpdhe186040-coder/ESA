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
    const questions = await Question.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
      { $sample: { size: 10 } },
    ]);

    const questionIds = questions.map(q => q._id);

    // Lấy TẤT CẢ thông tin câu trả lời, bao gồm cả 'isCorrect'
    const allAnswers = await Answer.find({ questionId: { $in: questionIds } }).lean();

    // Xử lý dữ liệu để thêm số lượng đáp án đúng và ẩn 'isCorrect'
    const populatedQuestions = questions.map(question => {
      const answersForQuestion = allAnswers.filter(
        a => a.questionId.toString() === question._id.toString()
      );

      // Đếm có bao nhiêu câu trả lời đúng
      const correctAnswerCount = answersForQuestion.filter(a => a.isCorrect).length;

      // Xóa trường 'isCorrect' khỏi từng câu trả lời để không bị lộ
      const sanitizedAnswers = answersForQuestion.map(({ isCorrect, ...rest }) => rest);

      return {
        ...question,
        answers: sanitizedAnswers,
        // Frontend sẽ dựa vào trường này để hiển thị ô tròn/vuông
        correctAnswerCount: correctAnswerCount, 
      };
    });

    res.status(200).json(populatedQuestions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Chấm điểm bài làm
exports.submitQuiz = async (req, res) => {
    // Hàm này không được sử dụng ở frontend nhưng vẫn cập nhật cho đúng logic
    try {
        const userAnswers = req.body.answers; // Expects an array like [{ questionId: '...', selectedAnswerIds: ['...'] }]

        const questionIds = userAnswers.map(ua => ua.questionId);
        
        const correctAnswers = await Answer.find({
            questionId: { $in: questionIds },
            isCorrect: true
        }).lean();

        const correctAnswerMap = new Map();
        correctAnswers.forEach(ans => {
            const questionIdStr = ans.questionId.toString();
            if (!correctAnswerMap.has(questionIdStr)) {
                correctAnswerMap.set(questionIdStr, []);
            }
            correctAnswerMap.get(questionIdStr).push(ans._id.toString());
        });

        let score = 0;
        const results = userAnswers.map(ua => {
            const correctIds = correctAnswerMap.get(ua.questionId) || [];
            const selectedIds = ua.selectedAnswerIds;
            
            // Sắp xếp để so sánh
            const isCorrect = JSON.stringify(correctIds.sort()) === JSON.stringify(selectedIds.sort());

            if (isCorrect) {
                score++;
            }
            return {
                questionId: ua.questionId,
                selectedAnswerIds: selectedIds,
                correctAnswerIds: correctIds,
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

// 4. KIỂM TRA TỪNG CÂU TRẢ LỜI (HÀM QUAN TRỌNG CẦN THAY ĐỔI)
exports.checkAnswer = async (req, res) => {
    try {
        // Thay vì answerId, chúng ta nhận một mảng các answerIds
        const { questionId, answerIds } = req.body;

        // Lấy tất cả các câu trả lời của người dùng
        const selectedAnswers = await Answer.find({ _id: { $in: answerIds } }).lean();
        if (selectedAnswers.length !== answerIds.length) {
             return res.status(404).json({ message: 'One or more answers not found.' });
        }
        
        // Lấy tất cả các đáp án ĐÚNG của câu hỏi từ DB
        const correctAnswers = await Answer.find({ questionId: questionId, isCorrect: true }).lean();
        
        // Lấy ID của các đáp án đúng
        const correctAnswerIds = correctAnswers.map(ans => ans._id.toString());
        
        // --- Logic kiểm tra ---
        // 1. Lấy các câu trả lời sai mà người dùng đã chọn
        const incorrectSelected = selectedAnswers.some(ans => !ans.isCorrect);
        // 2. So sánh số lượng đáp án đúng với số lượng người dùng chọn
        const allCorrectsSelected = correctAnswerIds.length === selectedAnswers.length;

        // Kết quả cuối cùng: người dùng phải chọn TẤT CẢ đáp án đúng VÀ KHÔNG chọn đáp án sai nào.
        const isFullyCorrect = !incorrectSelected && allCorrectsSelected;
        
        res.status(200).json({
            isCorrect: isFullyCorrect,
            correctAnswerIds: correctAnswerIds // Trả về mảng các ID đúng
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ## CÁC HÀM CHO TEACHER  ##
// ==========================================================

// Lấy TẤT CẢ các quiz để hiển thị cho teacher
exports.getQuizzesByTeacher = async (req, res) => {
    try {
        // SỬA ĐỔI: Gỡ bỏ điều kiện { teacherId: req.user.id } để lấy tất cả quiz
        const quizzes = await Quiz.find({}).populate('courseId', 'name');
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo một quiz mới (giữ nguyên, vì khi tạo mới vẫn cần gán teacherId của người tạo)
exports.createQuiz = async (req, res) => {
    try {
        const { title, description, courseId, timeLimit } = req.body;
        const teacherId = req.user.id; // Lấy từ token

        const existingQuiz = await Quiz.findOne({ courseId });
        if (existingQuiz) {
            return res.status(400).json({ success: false, message: 'This course already has a quiz.' });
        }

        const newQuiz = new Quiz({ title, description, courseId, timeLimit, teacherId });
        await newQuiz.save();
        res.status(201).json({ success: true, message: 'Quiz created successfully', data: newQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết 1 quiz (bất kỳ)
exports.getQuizDetails = async (req, res) => {
    try {
        // SỬA ĐỔI: Gỡ bỏ điều kiện teacherId, chỉ cần tìm theo ID của quiz
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Cập nhật một quiz (bất kỳ)
exports.updateQuiz = async (req, res) => {
    try {
        const { title, description, courseId, timeLimit } = req.body;

        // SỬA ĐỔI: Gỡ bỏ điều kiện teacherId, chỉ cần tìm và cập nhật theo ID
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { title, description, courseId, timeLimit },
            { new: true }
        );

        if (!updatedQuiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }
        res.status(200).json({ success: true, message: 'Quiz updated successfully', data: updatedQuiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa một quiz (bất kỳ)
exports.deleteQuiz = async (req, res) => {
    try {
        // SỬA ĐỔI: Gỡ bỏ điều kiện teacherId, chỉ cần tìm và xóa theo ID
        const quiz = await Quiz.findByIdAndDelete(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }

        const questions = await Question.find({ quizId: quiz._id }).select('_id');
        const questionIds = questions.map(q => q._id);

        await Question.deleteMany({ quizId: quiz._id });
        await Answer.deleteMany({ questionId: { $in: questionIds } });
        
        res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};