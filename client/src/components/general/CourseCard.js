import React from 'react';

const CourseCard = ({ course }) => {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        // 2. THAY THẺ <Link> BẰNG THẺ <div>
        <div className="block group h-full"> {/* Thêm 'h-full' để đảm bảo thẻ div chiếm đủ chiều cao */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl h-full flex flex-col"> {/* Thêm 'h-full' và 'flex' */}
                <img 
                    src={course.image || 'https://via.placeholder.com/400x225.png?text=No+Image'} 
                    alt={course.name}
                    className="w-full h-48 object-cover" 
                />
                <div className="p-4 flex flex-col flex-grow"> {/* Thêm 'flex flex-col flex-grow' */}
                    <h3 className="text-xl font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                        {course.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{course.level}</p>
                    <p className="text-lg font-semibold text-indigo-700 mt-auto pt-4"> {/* Thêm 'mt-auto' để đẩy giá xuống dưới */}
                        {formatPrice(course.price)}
                    </p>
                </div>
            </div>
        </div>
        // 3. ĐÓNG THẺ </div>
    );
};

export default CourseCard;