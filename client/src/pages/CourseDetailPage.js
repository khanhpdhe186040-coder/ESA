import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CourseDetailPage = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await fetch(`http://localhost:9999/api/courses/${courseId}`);
                const responseData = await response.json();
                if (!responseData.success) {
                    throw new Error(responseData.message || 'Course not found');
                }
                setCourse(responseData.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (loading) {
        return <div className="text-center py-10">Loading course details...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    if (!course) {
        return <div className="text-center py-10">Course not found.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="md:flex">
                    <div className="md:flex-shrink-0">
                        <img 
                            className="h-64 w-full object-cover md:w-80" 
                            src={course.image || 'https://via.placeholder.com/400x225.png?text=No+Image'} 
                            alt={course.name} 
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-between">
                        <div>
                            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{course.level}</div>
                            <h1 className="block mt-1 text-3xl leading-tight font-extrabold text-black">{course.name}</h1>
                            <p className="mt-4 text-gray-600">{course.description}</p>
                        </div>
                        <div className="mt-6">
                            <span className="text-3xl font-bold text-gray-900">{formatPrice(course.price)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center flex justify-center gap-4">
                <Link 
                    to="/" 
                    className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                >
                    Back to All Courses
                </Link>

                {/* SỬA ĐỔI: Gỡ bỏ điều kiện kiểm tra token, luôn hiển thị nút "Take the Quiz" */}
                <Link 
                    to={`/student/quiz/${course._id}`}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    Take the Quiz
                </Link>
            </div>
        </div>
    );
};

export default CourseDetailPage;