import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QUIZ_STORAGE_KEY = 'currentQuizState';

const Quiz = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // State chung
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho từng câu hỏi và tiến trình
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswerId, setSelectedAnswerId] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [answerResult, setAnswerResult] = useState(null);
    const [finalScore, setFinalScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isQuizFinished, setIsQuizFinished] = useState(false);

    // --- LOGIC LƯU VÀ TẢI TRẠNG THÁI (ĐÃ NÂNG CẤP) ---

    const clearQuizState = useCallback(() => {
        localStorage.removeItem(QUIZ_STORAGE_KEY);
    }, []);

    // Effect này chỉ chạy MỘT LẦN khi component được tải
    useEffect(() => {
        const loadStateAndFetchData = async () => {
            const savedState = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY));
            
            if (savedState && savedState.courseId === courseId) {
                // Khôi phục lại toàn bộ tiến trình, BAO GỒM CẢ TRẠNG THÁI SUBMIT
                setQuiz(savedState.quiz);
                setQuestions(savedState.questions);
                setCurrentQuestionIndex(savedState.currentQuestionIndex);
                setFinalScore(savedState.finalScore);
                setTimeLeft(savedState.timeLeft);
                setIsQuizFinished(savedState.isQuizFinished);
                
                // --- PHẦN NÂNG CẤP ---
                // Khôi phục lại trạng thái của câu trả lời đã submit
                setSelectedAnswerId(savedState.selectedAnswerId || null);
                setIsSubmitted(savedState.isSubmitted || false);
                setAnswerResult(savedState.answerResult || null);
                // --- KẾT THÚC NÂNG CẤP ---

                setLoading(false);
            } else {
                clearQuizState();
                const token = localStorage.getItem('token');
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

    // Effect này sẽ LƯU trạng thái vào localStorage mỗi khi có thay đổi
    useEffect(() => {
        if (!loading && quiz && !isQuizFinished) {
            const stateToSave = {
                courseId,
                quiz,
                questions,
                currentQuestionIndex,
                finalScore,
                timeLeft,
                isQuizFinished,

                // --- PHẦN NÂNG CẤP ---
                // Lưu lại trạng thái của câu trả lời hiện tại
                selectedAnswerId,
                isSubmitted,
                answerResult,
                // --- KẾT THÚC NÂNG CẤP ---
            };
            localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [
        courseId, quiz, questions, currentQuestionIndex, finalScore, timeLeft, isQuizFinished, loading,
        selectedAnswerId, isSubmitted, answerResult // Thêm các state này vào dependency array
    ]);
    
    // --- KẾT THÚC LOGIC LƯU/TẢI ---

    // Effect chạy đồng hồ
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

    // Các hàm xử lý sự kiện (giữ nguyên, không thay đổi)
    const handleAnswerSelect = (answerId) => {
        if (!isSubmitted) setSelectedAnswerId(answerId);
    };

    const handleQuestionSubmit = async () => {
        if (!selectedAnswerId) {
            alert("Please select an answer!");
            return;
        }
        const token = localStorage.getItem('token');
        try {
            const response = await axios.post(`http://localhost:9999/api/quiz/check-answer`, {
                questionId: questions[currentQuestionIndex]._id,
                answerId: selectedAnswerId
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
            setSelectedAnswerId(null);
            setAnswerResult(null);
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }
    };

    const getAnswerClassName = (answerId) => {
        if (!isSubmitted) return "hover:bg-gray-100";
        const { correctAnswerId } = answerResult || {};
        if (answerId === correctAnswerId) return "bg-green-200";
        if (answerId === selectedAnswerId && answerId !== correctAnswerId) return "bg-red-200";
        return "";
    };

    const formatTime = (seconds) => {
        if (seconds === null || seconds < 0) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // ----- GIAO DIỆN RENDER (giữ nguyên, không thay đổi) -----

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
                <button 
                    onClick={() => navigate('/student/register-class')}
                    className="mt-6 w-full bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700"
                >
                    Back to Register Class
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <div className="p-6 text-center">Loading questions...</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-3xl font-bold">{quiz.title}</h1>
                    <p className="text-lg font-semibold text-gray-700 mt-2">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                </div>
                {timeLeft !== null && (
                     <div className="text-2xl font-bold text-red-500 bg-red-100 px-4 py-2 rounded-lg">
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>
            <div className="p-6 border rounded-lg bg-white shadow-lg">
                <p className="text-xl font-medium mb-4">{currentQuestion.questionText}</p>
                <div className="space-y-3">
                    {currentQuestion.answers.map(ans => (
                        <div 
                            key={ans._id}
                            onClick={() => handleAnswerSelect(ans._id)}
                            className={`flex items-center p-3 rounded cursor-pointer border-2 transition-all 
                                ${selectedAnswerId === ans._id ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
                                ${getAnswerClassName(ans._id)}
                            `}
                        >
                            <span className="font-bold mr-3">{String.fromCharCode(65 + currentQuestion.answers.indexOf(ans))}.</span>
                            <span>{ans.answerText}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6 text-center">
                {!isSubmitted ? (
                    <button 
                        onClick={handleQuestionSubmit}
                        disabled={!selectedAnswerId}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Submit
                    </button>
                ) : (
                    <button 
                        onClick={handleNextQuestion}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                        {currentQuestionIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Quiz;