import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, XCircle } from 'lucide-react';

const QuestionForm = () => {
    // quizId is for 'new', questionId is for 'edit'
    const { quizId, questionId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(questionId);

    const [questionText, setQuestionText] = useState('');
    const [answers, setAnswers] = useState([
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
        { answerText: '', isCorrect: false },
    ]);
    const [originalQuizId, setOriginalQuizId] = useState(quizId);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditing);

    useEffect(() => {
        if (isEditing) {
            const fetchQuestionData = async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await axios.get(`http://localhost:9999/api/quiz/teacher/question/${questionId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const { questionText, answers, quizId } = res.data.data;
                    setQuestionText(questionText);
                    setAnswers(answers.map(({ answerText, isCorrect }) => ({ answerText, isCorrect })));
                    setOriginalQuizId(quizId); // Store the original quizId for navigation
                } catch (err) {
                    setError('Failed to load question data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchQuestionData();
        }
    }, [isEditing, questionId]);

    const handleAnswerChange = (index, field, value) => {
        const newAnswers = [...answers];
        newAnswers[index][field] = value;
        setAnswers(newAnswers);
    };

    const addAnswerField = () => {
        setAnswers([...answers, { answerText: '', isCorrect: false }]);
    };

    const removeAnswerField = (index) => {
        if (answers.length <= 2) {
            alert('A question must have at least 2 answers.');
            return;
        }
        const newAnswers = answers.filter((_, i) => i !== index);
        setAnswers(newAnswers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (answers.filter(a => a.isCorrect).length === 0) {
            setError('You must select at least one correct answer.');
            return;
        }

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const payload = { questionText, answers };

        try {
            if (isEditing) {
                await axios.put(`http://localhost:9999/api/quiz/teacher/question/${questionId}`, payload, config);
                navigate(`/teacher/quizzes/${originalQuizId}/questions`);
            } else {
                await axios.post(`http://localhost:9999/api/quiz/teacher/quiz/${quizId}/questions`, payload, config);
                navigate(`/teacher/quizzes/${quizId}/questions`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save question.');
        }
    };
    
    const backLink = `/teacher/quizzes/${originalQuizId}/questions`;
    
    if (loading) return <div>Loading form...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Question' : 'Add New Question'}</h1>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label htmlFor="questionText" className="block text-lg font-medium mb-2">Question Text</label>
                    <textarea 
                        id="questionText" 
                        value={questionText} 
                        onChange={(e) => setQuestionText(e.target.value)}
                        required 
                        className="w-full mt-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                    />
                </div>
                
                <div>
                    <h2 className="text-lg font-medium mb-2">Answers</h2>
                    <div className="space-y-3">
                        {answers.map((answer, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                                <input 
                                    type="text" 
                                    placeholder={`Answer ${index + 1}`}
                                    value={answer.answerText}
                                    onChange={(e) => handleAnswerChange(index, 'answerText', e.target.value)}
                                    required
                                    className="flex-grow p-2 border rounded-md"
                                />
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={answer.isCorrect}
                                        onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                                        className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Correct
                                </label>
                                <button type="button" onClick={() => removeAnswerField(index)} title="Remove Answer">
                                    <XCircle className="text-red-500 hover:text-red-700" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addAnswerField} className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                        <PlusCircle size={20} /> Add Another Answer
                    </button>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                    <button type="button" onClick={() => navigate(backLink)} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{isEditing ? 'Update Question' : 'Save Question'}</button>
                </div>
            </form>
        </div>
    );
};

export default QuestionForm;