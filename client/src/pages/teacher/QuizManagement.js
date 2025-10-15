import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const QuizManagementPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:9999/api/quiz/teacher/my-quizzes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizzes(res.data.data);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleDelete = async (quizId) => {
        if (window.confirm('Are you sure you want to delete this quiz? This action is irreversible.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:9999/api/quiz/teacher/delete/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchQuizzes(); // Refresh the list after deleting
            } catch (error) {
                alert('Failed to delete quiz.');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quiz Management</h1>
                {/* Tạm thời comment nút Add New, sẽ làm ở bước sau */}
                {/* <Link to="/teacher/quizzes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Create New Quiz
                </Link> */}
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-5 py-3 text-left">Title</th>
                            <th className="px-5 py-3 text-left">Associated Course</th>
                            <th className="px-5 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quizzes.length > 0 ? quizzes.map(quiz => (
                            <tr key={quiz._id} className="border-b">
                                <td className="px-5 py-4">{quiz.title}</td>
                                <td className="px-5 py-4">{quiz.courseId?.name || 'N/A'}</td>
                                <td className="px-5 py-4">
                                    <button className="text-green-600 hover:underline mr-4">Manage Questions</button>
                                    <button className="text-indigo-600 hover:underline mr-4">Edit</button>
                                    <button onClick={() => handleDelete(quiz._id)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="text-center py-10 text-gray-500">No quizzes found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuizManagementPage;