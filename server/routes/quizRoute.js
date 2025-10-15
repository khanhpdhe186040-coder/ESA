const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authTeacher = require('../middlewares/authTeacher');

// Thêm các route mới
router.get('/course/:courseId', quizController.getQuizByCourse);
router.get('/:quizId/questions', quizController.getQuizQuestions);
router.post('/:quizId/submit', quizController.submitQuiz);
router.post('/check-answer', quizController.checkAnswer);
// === CÁC ROUTE CHO TEACHER ===
router.get('/teacher/my-quizzes', authTeacher, quizController.getQuizzesByTeacher); 
router.post('/teacher/create', authTeacher, quizController.createQuiz);
router.get('/teacher/:id', authTeacher, quizController.getQuizDetails);
router.put('/teacher/update/:id', authTeacher, quizController.updateQuiz);
router.delete('/teacher/delete/:id', authTeacher, quizController.deleteQuiz);
module.exports = router;