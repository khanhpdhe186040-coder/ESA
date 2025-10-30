import React from 'react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <Link to={`/course/${course._id}`} className="block group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <img 
                    src={course.image || 'https://via.placeholder.com/400x225.png?text=No+Image'} 
                    alt={course.name}
                    className="w-full h-48 object-cover" 
                />
                <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                        {course.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{course.level}</p>
                    <p className="text-lg font-semibold text-indigo-700 mt-4">
                        {formatPrice(course.price)}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default CourseCard;