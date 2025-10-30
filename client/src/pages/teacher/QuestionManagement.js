import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const QuestionManagementPage = () => {
    const { quizId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchQuestions = useCallback(async (page) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // SỬA ĐỔI: Gọi đến API mới dành cho teacher
            const res = await axios.get(`http://localhost:9999/api/quiz/teacher/quiz/${quizId}/questions?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setQuestions(res.data.data);
                setTotalPages(res.data.totalPages);
                setCurrentPage(res.data.currentPage);
            }

            // Lấy tiêu đề quiz (giữ nguyên)
            const quizRes = await axios.get(`http://localhost:9999/api/quiz/teacher/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizTitle(quizRes.data.data.title);

        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuestions(currentPage);
    }, [fetchQuestions, currentPage]);

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:9999/api/quiz/teacher/question/${questionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (questions.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    fetchQuestions(currentPage);
                }
                
            } catch (error) {
                alert('Failed to delete the question.');
            }
        }
    };
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading) return <div>Loading questions...</div>;

    return (
        <div className="container mx-auto p-4">
            <Link to="/teacher/quizzes" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Quiz List</Link>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manage Questions for: <span className="text-blue-700">{quizTitle}</span></h1>
                <Link to={`/teacher/quizzes/${quizId}/questions/new`} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add New Question
                </Link>
            </div>
            
            <div className="bg-white shadow-md rounded-lg mt-6">
                <ul className="divide-y divide-gray-200">
                    {questions.length > 0 ? questions.map((q, index) => (
                        <li key={q._id} className="p-4 flex justify-between items-center">
                            <span className="font-medium">{(currentPage - 1) * 10 + index + 1}. {q.questionText}</span>
                            <div>
                                <Link to={`/teacher/quizzes/questions/edit/${q._id}`} className="text-indigo-600 hover:underline mr-4">Edit</Link>
                                <button onClick={() => handleDeleteQuestion(q._id)} className="text-red-600 hover:underline">Delete</button>
                            </div>
                        </li>
                    )) : (
                        <p className="p-4 text-center text-gray-500">No questions found for this quiz.</p>
                    )}
                </ul>
            </div>
            
            <div className="flex justify-center items-center mt-6 gap-4">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default QuestionManagementPage;