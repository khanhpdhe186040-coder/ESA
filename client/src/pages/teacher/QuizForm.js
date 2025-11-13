import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const QuizForm = () => {
    const { quizId } = useParams(); // Will be undefined for new quizzes
    const navigate = useNavigate();
    const isEditing = Boolean(quizId);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        timeLimit: 30,
    });
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');

    // Fetch list of available courses to link to the quiz
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // This API is public, so no token needed
                const res = await axios.get('http://localhost:9999/api/courses/public');
                if (res.data.success) {
                    setCourses(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch courses", err);
            }
        };
        fetchCourses();
    }, []);

    // If we are editing, fetch the existing quiz data
    useEffect(() => {
        if (isEditing) {
            const fetchQuizData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:9999/api/quiz/teacher/${quizId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        const { title, description, courseId, timeLimit } = res.data.data;
                        setFormData({ title, description, courseId, timeLimit });
                    }
                } catch (err) {
                    setError('Failed to fetch quiz data.');
                }
            };
            fetchQuizData();
        }
    }, [quizId, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/quiz/teacher/update/${quizId}`, formData, config);
            } else {
                await axios.post('http://localhost:9999/api/quiz/teacher/create', formData, config);
            }
            navigate('/teacher/quizzes');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Quiz' : 'Create New Quiz'}</h1>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <div>
                    <label htmlFor="title" className="block font-medium">Title</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full mt-1 p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="description" className="block font-medium">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} className="w-full mt-1 p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="courseId" className="block font-medium">Associated Course</label>
                    <select name="courseId" id="courseId" value={formData.courseId} onChange={handleChange} required className="w-full mt-1 p-2 border rounded bg-white">
                        <option value="" disabled>Select a course</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="timeLimit" className="block font-medium">Time Limit (minutes)</label>
                    <input type="number" name="timeLimit" id="timeLimit" value={formData.timeLimit} onChange={handleChange} required min="1" className="w-full mt-1 p-2 border rounded"/>
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate('/teacher/quizzes')} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{isEditing ? 'Update Quiz' : 'Create Quiz'}</button>
                </div>
            </form>
        </div>
    );
};

export default QuizForm;