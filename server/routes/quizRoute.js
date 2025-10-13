const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');


// Thêm các route mới
router.get('/course/:courseId', quizController.getQuizByCourse);
router.get('/:quizId/questions', quizController.getQuizQuestions);
router.post('/:quizId/submit', quizController.submitQuiz);
router.post('/check-answer', quizController.checkAnswer);
module.exports = router;