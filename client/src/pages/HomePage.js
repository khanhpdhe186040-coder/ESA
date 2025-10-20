import React, { useState, useEffect } from 'react';
import CourseCard from '../components/general/CourseCard'; 

const HomePage = () => {
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch('http://localhost:9999/api/courses');
                const responseData = await response.json();
                if (!responseData.success) {
                    throw new Error(responseData.message || 'Failed to fetch');
                }
                const activeCourses = responseData.data.filter(course => course.status === 'active');
                setCourses(activeCourses);
            } catch (err) {
                setError('Failed to fetch courses. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center py-10">Loading courses...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800">Explore Our Courses</h1>
                <p className="text-lg text-gray-600 mt-2">Find the perfect course to boost your English skills.</p>
            </div>

            <div className="mb-8 max-w-2xl mx-auto">
                <input
                    type="text"
                    placeholder="Search for a course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.map(course => (
                        <CourseCard key={course._id} course={course} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No courses found matching your search.</p>
            )}
        </div>
    );
};

export default HomePage;