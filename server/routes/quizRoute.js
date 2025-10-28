const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { jwtAuth } = require('../middlewares/auth'); // Middleware xác thực người dùng đã đăng nhập

// Thêm các route mới
router.get('/course/:courseId', jwtAuth, quizController.getQuizByCourse);
router.get('/:quizId/questions', jwtAuth, quizController.getQuizQuestions);
router.post('/:quizId/submit', jwtAuth, quizController.submitQuiz);
router.post('/check-answer', jwtAuth, quizController.checkAnswer);
module.exports = router;