import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QUIZ_STORAGE_KEY = 'currentQuizState';

const Quiz = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // Các state giữ nguyên
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswerIds, setSelectedAnswerIds] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [answerResult, setAnswerResult] = useState(null);
    const [finalScore, setFinalScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isQuizFinished, setIsQuizFinished] = useState(false);

    // Các hàm xử lý logic khác giữ nguyên
    const clearQuizState = useCallback(() => {
        localStorage.removeItem(QUIZ_STORAGE_KEY);
    }, []);

    const handleRetakeQuiz = () => {
        clearQuizState();
        window.location.reload();
    };

    useEffect(() => {
        const loadStateAndFetchData = async () => {
            const savedState = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
            
            if (savedState && savedState.courseId === courseId) {
                setQuiz(savedState.quiz);
                setQuestions(savedState.questions);
                setCurrentQuestionIndex(savedState.currentQuestionIndex);
                setFinalScore(savedState.finalScore);
                setTimeLeft(savedState.timeLeft);
                setIsQuizFinished(savedState.isQuizFinished);
                setSelectedAnswerIds(savedState.selectedAnswerIds || []);
                setIsSubmitted(savedState.isSubmitted || false);
                setAnswerResult(savedState.answerResult || null);
                setLoading(false);
            } else {
                clearQuizState();
                const token = localStorage.getItem('token');

                 //Chỉ thêm header Authorization nếu có token
                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
                try {
                    const quizResponse = await axios.get(`http://localhost:9999/api/quiz/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
                    const quizData = quizResponse.data;
                    setQuiz(quizData);
                    setTimeLeft(quizData.timeLimit * 60);

                    const questionsResponse = await axios.get(`http://localhost:9999/api/quiz/${quizData._id}/questions`, { headers: { Authorization: `Bearer ${token}` } });
                    setQuestions(questionsResponse.data);
                } catch (err) {
                    setError('Failed to load quiz. The course may not have a quiz yet.');
                } finally {
                    setLoading(false);
                }
            }
        };

        loadStateAndFetchData();
    }, [courseId, clearQuizState]);

    useEffect(() => {
        if (!loading && quiz && !isQuizFinished) {
            const stateToSave = {
                courseId,
                quiz,
                questions,
                currentQuestionIndex,
                selectedAnswerIds,
                isSubmitted,
                answerResult,
                finalScore,
                timeLeft,
                isQuizFinished
            };
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [courseId, quiz, questions, currentQuestionIndex, finalScore, selectedAnswerIds, timeLeft, isQuizFinished, loading, isSubmitted, answerResult]);
    
    useEffect(() => {
        if (timeLeft === null || isQuizFinished) return;
        if (timeLeft === 0) {
            setIsQuizFinished(true);
            clearQuizState();
            return;
        }
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, isQuizFinished, clearQuizState]);

    // ==========================================================
    // ## HÀM ĐƯỢC CẬP NHẬT LOGIC MỚI ##
    // ==========================================================
    const handleAnswerSelect = (answerId) => {
        if (isSubmitted) return;
        const limit = questions[currentQuestionIndex].correctAnswerCount;

        // Logic cho câu hỏi 1 đáp án không đổi
        if (limit === 1) {
            setSelectedAnswerIds([answerId]);
            return;
        }

        // Logic cho câu hỏi nhiều đáp án
        setSelectedAnswerIds(prevSelectedIds => {
            // Nếu đáp án đã được chọn -> Bỏ chọn
            if (prevSelectedIds.includes(answerId)) {
                return prevSelectedIds.filter(id => id !== answerId);
            }

            // Nếu đã đạt giới hạn -> Loại bỏ cái cũ nhất, thêm cái mới nhất
            if (prevSelectedIds.length >= limit) {
                // Dùng slice(1) để tạo mảng mới không chứa phần tử đầu tiên (cũ nhất)
                const newSelection = prevSelectedIds.slice(1);
                // Thêm phần tử mới vào cuối
                return [...newSelection, answerId];
            }

            // Nếu chưa đạt giới hạn -> Chỉ cần thêm vào
            return [...prevSelectedIds, answerId];
        });
    };
    // ==========================================================

    const handleQuestionSubmit = async () => {
        if (selectedAnswerIds.length === 0) {
            alert("Please select at least one answer!");
            return;
        }
        const token = localStorage.getItem('token');
        // Chỉ thêm header Authorization nếu có token
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        try {
            const response = await axios.post(`http://localhost:9999/api/quiz/check-answer`, {
                questionId: questions[currentQuestionIndex]._id,
                answerIds: selectedAnswerIds
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setAnswerResult(response.data);
            setIsSubmitted(true);
            if (response.data.isCorrect) {
                setFinalScore(prevScore => prevScore + 1);
            }
        } catch (err) {
            setError('Error submitting answer.');
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex + 1 >= questions.length) {
            setIsQuizFinished(true);
            clearQuizState();
        } else {
            setIsSubmitted(false);
            setSelectedAnswerIds([]);
            setAnswerResult(null);
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    const getAnswerClassName = (answerId) => {
        if (!isSubmitted) return "hover:bg-gray-100";
        const { correctAnswerIds } = answerResult || {};
        if (correctAnswerIds && correctAnswerIds.includes(answerId)) {
            return "bg-green-200";
        }
        if (selectedAnswerIds.includes(answerId) && (!correctAnswerIds || !correctAnswerIds.includes(answerId))) {
            return "bg-red-200";
        }
        return "";
    };

    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    if (loading) return <div className="p-6 text-center">Loading Quiz...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

    if (isQuizFinished) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-4">
                    {timeLeft === 0 ? "Time's Up!" : "Quiz Completed!"}
                </h1>
                <div className="bg-blue-100 p-6 rounded-lg shadow-md">
                    <p className="text-xl">Your Final Score</p>
                    <p className="text-5xl font-bold my-4 text-blue-600">{finalScore} / {questions.length}</p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/student/register-class')} className="w-full bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700">Back to Register Class</button>
                    <button onClick={handleRetakeQuiz} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">Retake Quiz</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <div className="p-6 text-center">Loading questions...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-3xl font-bold">{quiz?.title}</h1>
                    <p className="text-lg font-semibold text-gray-700 mt-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
                {timeLeft !== null && (<div className="text-2xl font-bold text-red-500 bg-red-100 px-4 py-2 rounded-lg">{formatTime(timeLeft)}</div>)}
            </div>
            <div className="p-6 border rounded-lg bg-white shadow-lg">
                <p className="text-xl font-medium mb-2">{currentQuestion.questionText}</p>
                {currentQuestion.correctAnswerCount > 0 && (<p className="text-sm font-semibold text-blue-600 mb-4">(Choose {currentQuestion.correctAnswerCount} {currentQuestion.correctAnswerCount > 1 ? 'answers' : 'answer'})</p>)}
                
                <div className="space-y-3">
                    {currentQuestion.answers.map((ans, index) => {
                        const isSelected = selectedAnswerIds.includes(ans._id);
                        const isRadio = currentQuestion.correctAnswerCount === 1;

                        return (
                            <div 
                                key={ans._id}
                                onClick={() => handleAnswerSelect(ans._id)}
                                className={`flex items-center p-3 rounded cursor-pointer border-2 transition-all 
                                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
                                    ${getAnswerClassName(ans._id)}
                                `}
                            >
                                <div className="flex-shrink-0 mr-4">
                                    {isRadio ? (
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-400'}`}>
                                            {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                                        </div>
                                    ) : (
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                                <span>{ans.answerText}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="mt-6 text-center">
                {!isSubmitted ? (
                    <button onClick={handleQuestionSubmit} disabled={selectedAnswerIds.length === 0} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">Submit</button>
                ) : (
                    <button onClick={handleNextQuestion} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                        {currentQuestionIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;