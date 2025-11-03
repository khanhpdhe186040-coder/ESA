import React, { useState, useEffect } from 'react';
import CourseCard from '../components/general/CourseCard'; 
import Slider from "react-slick"; // Import the slider component
import { Link } from 'react-router-dom';
// Import slick-carousel CSS
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";



const HomePage = () => {
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const coursesPerPage = 6; // Số lượng khóa học mỗi trang
    useEffect(() => {

        const fetchCourses = async () => {
            try {
                const response = await fetch('http://localhost:9999/api/courses/public');
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

    // Tính toán khóa học cho trang hiện tại
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

    // Hàm chuyển trang
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
             window.scrollTo(0, 0); // Cuộn lên đầu trang khi chuyển trang
        }
    };

    // Slider settings
    const sliderSettings = {
        dots: true, // Show navigation dots
        infinite: true, // Loop the slider
        speed: 500, // Transition speed in ms
        slidesToShow: 1, // Show one slide at a time
        slidesToScroll: 1, // Scroll one slide at a time
        autoplay: true, // Automatically slide
        autoplaySpeed: 3000, // Change slide every 3 seconds
        fade: true, // Use fade effect
        cssEase: 'linear',
        arrows: true
    };

   const sliderImages = [
        { id: 1, src: "/slider-pictures/logo.png", alt: "Slider Image 1" },
        { id: 2, src: "/slider-pictures/english.webp", alt: "Slider Image 2" },
        { id: 3, src: "/slider-pictures/discount.jpg", alt: "Slider Image 3" },
    ];

    if (loading && courses.length === 0) { // Show loading only initially
        return <div className="text-center py-10">Loading page...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* ========================================================== */}
            {/* ## SLIDER SECTION ADDED HERE ## */}
            {/* ========================================================== */}
           <div className="max-w-7xl mx-auto"> 
                <div className="mb-12 shadow-lg rounded-lg overflow-hidden">
                    <Slider {...sliderSettings}>
                        {sliderImages.map((image) => (
                            <div key={image.id}>
                                <img 
                                    src={image.src} 
                                    alt={image.alt} 
                                    // SỬA ĐỔI: Giảm chiều cao ảnh nếu cần thiết
                                    className="w-full h-56 md:h-80 object-cover" // Giảm chiều cao từ h-64/h-96
                                />
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
            {/* ========================================================== */}

            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800">Explore Our Courses</h1>
                <p className="text-lg text-gray-600 mt-2">Find the perfect course to boost your English skills.</p>
            </div>

            <div className="mb-8 max-w-2xl mx-auto">
                <input
                    type="text"
                    placeholder="Search for a course..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset về trang đầu khi thay đổi tìm kiếm
                    }}
                    className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            
           {loading ? ( 
                <div className="text-center py-10">Loading courses...</div> 
            ) : currentCourses.length > 0 ? ( 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentCourses.map(course => (
                        // 2. BỌC COURSE CARD BẰNG THẺ LINK CỦA GUEST
                        <Link key={course._id} to={`/course/${course._id}`} className="block hover:shadow-lg transition-shadow duration-300 rounded-lg">
                            <CourseCard course={course} />
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No courses found matching your search.</p>
            )}

            
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-4">
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
            )}
        </div>
    );
};

export default HomePage;