const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const authTeacher = require('../middlewares/authTeacher');

// === CÁC ROUTE PUBLIC ===
router.get('/course/:courseId', quizController.getQuizByCourse);
router.get('/:quizId/questions', quizController.getQuizQuestions);
router.post('/check-answer', quizController.checkAnswer);

// === CÁC ROUTE QUẢN LÝ QUIZ CHO TEACHER ===
router.get('/teacher/my-quizzes', authTeacher, quizController.getQuizzesByTeacher); 
router.post('/teacher/create', authTeacher, quizController.createQuiz);
router.get('/teacher/:id', authTeacher, quizController.getQuizDetails);
router.put('/teacher/update/:id', authTeacher, quizController.updateQuiz);
router.delete('/teacher/delete/:id', authTeacher, quizController.deleteQuiz);

// === CÁC ROUTE QUẢN LÝ QUESTION CHO TEACHER ===
router.get('/teacher/quiz/:quizId/questions', authTeacher, quizController.getQuestionsForTeacher);
router.post('/teacher/quiz/:quizId/questions', authTeacher, quizController.createQuestion); 
router.get('/teacher/question/:questionId', authTeacher, quizController.getQuestionDetails);  
router.put('/teacher/question/:questionId', authTeacher, quizController.updateQuestion);     
router.delete('/teacher/question/:questionId', authTeacher, quizController.deleteQuestion);

module.exports = router;