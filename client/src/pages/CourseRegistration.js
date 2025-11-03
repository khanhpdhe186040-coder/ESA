import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Star, Clock, Users, Award, Check, User, Phone, Mail, MapPin, Calendar, Trophy, MessageSquare, ChevronUp, ChevronDown, X } from "lucide-react";
import { jwtDecode } from "jwt-decode";

const CourseRegistration = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Attempt to derive courseId from localStorage or from VNPay query (vnp_TxnRef format: `${courseId}-${timestamp}`)
  const deriveCourseId = () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pendingCourseId') : null;
    if (stored && stored !== 'undefined' && stored !== 'null') return stored;
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const txnRef = sp.get('vnp_TxnRef');
      if (txnRef && txnRef.includes('-')) {
        const id = txnRef.split('-')[0];
        if (id && id !== 'undefined' && id !== 'null') {
          localStorage.setItem('pendingCourseId', id);
          return id;
        }
      }
    }
    return null;
  };

  const normalizedParam = !courseId || courseId === 'undefined' || courseId === 'null' ? null : courseId;
  const effectiveCourseId = normalizedParam || deriveCourseId();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    number: "",
    address: "",
    birthday: "",
  });

  // Hardcoded data for better UI
  const hardcodedData = {
    rating: 4.8,
    totalRatings: 1234,
    duration: "12 weeks",
    instructor: {
      name: "Prof. John Smith",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
      bio: "Experienced educator with 15+ years in teaching",
      experience: "PhD in Computer Science",
    },
    highlights: [
      "Lifetime access to course materials",
      "Certificate of completion",
      "24/7 student support",
      "Interactive exercises",
      "Real-world projects",
    ],
    whatYouLearn: [
      "Master the fundamental concepts",
      "Build practical projects",
      "Prepare for real-world challenges",
      "Network with industry experts",
      "Develop problem-solving skills",
    ],
    testimonials: [
      {
        name: "Sarah Johnson",
        rating: 5,
        text: "This course transformed my understanding completely! Highly recommended.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      {
        name: "Michael Chen",
        rating: 5,
        text: "Best investment I made for my career. The instructor is amazing!",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
    ],
  };

  // Format price to VNĐ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Show banner based on paid status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const paid = sp.get('paid');
      if (paid === 'success') {
        setMessage('Payment Successfully! Your account has been created (pending).');
        setMessageType('success');
      } else if (paid === 'fail') {
        setMessage('Payment failed or cancelled.');
        setMessageType('error');
      } else if (paid === 'error') {
        setMessage('Could not finalize after payment. Please contact support.');
        setMessageType('error');
      }
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setCurrentUser(decoded);
          } catch (e) {}
        }

        // Fetch course
        const response = await axios.get(
          "http://localhost:9999/api/courses/public"
        );
        
        if (response.data.success) {
          const foundCourse = response.data.data.find(
            (c) => c._id === effectiveCourseId
          );
        
          if (foundCourse) {
            setCourse(foundCourse);
          } else {
            setError("Course not found");
          }
        }

        // Fetch reviews
        try {
          if (effectiveCourseId) {
            const reviewsResponse = await axios.get(
              `http://localhost:9999/api/courses/${effectiveCourseId}/reviews`
            );
            if (reviewsResponse.data.success) {
              setReviews(reviewsResponse.data.data);
            }
          }
        } catch (err) {}

        // Fetch teacher
        try {
          const teacherResponse = await axios.get(
            "http://localhost:9999/api/users/by-role?roleId=r2"
          );
          if (teacherResponse.data.data && teacherResponse.data.data.length > 0) {
            setTeacher(teacherResponse.data.data[0]);
          }
        } catch (err) {}
        
      } catch (err) {
        setError("Failed to load course information");
      } finally {
        setLoading(false);
      }
    };

    if (effectiveCourseId) {
      fetchCourse();
    } else {
      // Do not navigate to login; stay and show error instead
      setLoading(false);
      setError("Course not found");
    }
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setMessage("Full name is required");
      setMessageType("error");
      return false;
    }
    if (!formData.userName.trim()) {
      setMessage("Username is required");
      setMessageType("error");
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setMessage("Valid email is required");
      setMessageType("error");
      return false;
    }
    if (!formData.number.trim()) {
      setMessage("Phone number is required");
      setMessageType("error");
      return false;
    }
    if (!formData.address.trim()) {
      setMessage("Address is required");
      setMessageType("error");
      return false;
    }
    if (!formData.birthday) {
      setMessage("Birthday is required");
      setMessageType("error");
      return false;
    }
    return true;
  };

 // HÀM MỚI: Xử lý đăng ký cho sinh viên đã đăng nhập
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setIsSubmitting(true);

    if (!currentUser || !currentUser.id) {
      setMessage("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    try {
      // Quan trọng: Lưu ID người dùng hiện tại thay vì biểu mẫu
      localStorage.setItem('pendingUserId', currentUser.id);
      localStorage.setItem('pendingCourseId', effectiveCourseId || '');
      // Xóa mọi dữ liệu biểu mẫu khách cũ có thể còn sót lại
      localStorage.removeItem('pendingCourseForm');

      const amountVnd = course?.price || 0;
      const orderId = `${effectiveCourseId}-${Date.now()}`;
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9999/api'}/payments/vnpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd, orderId, orderInfo: `Thanh toan khoa hoc ${course?.name}` })
      });
      const data = await res.json();
      if (res.ok && data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setMessage((data && data.message) ? data.message : 'Không thể tạo liên kết thanh toán.');
      setMessageType('error');
    } catch (err) {
      setMessage('Lỗi tạo thanh toán: ' + err.message);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // HÀM CŨ (ĐỔI TÊN): Xử lý đăng ký cho khách
  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Xóa mọi dữ liệu người dùng cũ có thể còn sót lại
      localStorage.removeItem('pendingUserId');
      // Lưu dữ liệu biểu mẫu cho khách
      localStorage.setItem('pendingCourseForm', JSON.stringify(formData));
      localStorage.setItem('pendingCourseId', effectiveCourseId || '');

      const amountVnd = course?.price || 0;
      const orderId = `${effectiveCourseId}-${Date.now()}`;
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9999/api'}/payments/vnpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd, orderId, orderInfo: `Thanh toan khoa hoc ${course?.name}` })
      });
      const data = await res.json();
      if (res.ok && data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setMessage((data && data.message) ? data.message : 'Không thể tạo liên kết thanh toán. Vui lòng kiểm tra cấu hình VNPay và thử lại.');
      setMessageType('error');
    } catch (err) {
      setMessage('Lỗi tạo thanh toán');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewText.trim() || !currentUser) return;

    setIsSubmittingReview(true);
    try {
      const response = await axios.post(
        `http://localhost:9999/api/courses/${effectiveCourseId}/reviews`,
        {
          userId: currentUser.id,
          text: reviewText,
        }
      );

      if (response.data.success) {
        setReviewText("");
        // Refresh reviews
        const reviewsResponse = await axios.get(
          `http://localhost:9999/api/courses/${effectiveCourseId}/reviews`
        );
        if (reviewsResponse.data.success) {
          setReviews(reviewsResponse.data.data);
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Upvote review
  const handleUpvote = async (reviewId) => {
    if (!currentUser) {
      alert("Please login to vote");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:9999/api/courses/${effectiveCourseId}/reviews/${reviewId}/upvote`,
        { userId: currentUser.id }
      );

      if (response.data.success) {
        // Update review count
        setReviews(prev => prev.map(review => {
          if (review._id === reviewId) {
            return { ...review, upvotes: { length: response.data.data.upvotes }, downvotes: { length: response.data.data.downvotes } };
          }
          return review;
        }));
      }
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  // Downvote review
  const handleDownvote = async (reviewId) => {
    if (!currentUser) {
      alert("Please login to vote");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:9999/api/courses/${effectiveCourseId}/reviews/${reviewId}/downvote`,
        { userId: currentUser.id }
      );

      if (response.data.success) {
        // Update review count
        setReviews(prev => prev.map(review => {
          if (review._id === reviewId) {
            return { ...review, upvotes: { length: response.data.data.upvotes }, downvotes: { length: response.data.data.downvotes } };
          }
          return review;
        }));
      }
    } catch (err) {
      console.error("Error downvoting:", err);
    }
  };

  // Get top reviews by upvotes
  const getTopReviews = () => {
    return [...reviews].sort((a, b) => {
      const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
      const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
      return bScore - aScore;
    }).slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
         <button
            onClick={() => {
              // Nếu là student, về /student/home. Nếu là guest, về /
              // (Giả định trang chủ student là /student/home)
              navigate(currentUser ? "/student/home" : "/");
            }}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-medium"
          >
            ← Back to Home
          </button>
          {/* ========================================================== */}
          <h1 className="text-4xl font-bold text-gray-900">Course Registration</h1>
          <p className="text-gray-600 mt-2">Complete your registration and start your learning journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                className="w-full h-64 object-cover"
                src={course?.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop"}
                alt={course?.name}
              />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                    {course?.level}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-bold">{4.8}</span>
                    <span className="text-gray-500">({(1234).toLocaleString()} đánh giá)</span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{course?.name}</h2>
                <p className="text-lg text-gray-600 mb-6">{course?.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold">12 weeks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Students</p>
                      <p className="font-semibold">{(1234).toLocaleString()}+ enrolled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructor Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                About the Instructor
              </h3>
              <div className="flex gap-6">
                <img
                  src={teacher?.fullName ? "https://image.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-250nw-2281862025.jpg" : hardcodedData.instructor.image}
                  alt={teacher?.fullName || hardcodedData.instructor.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{teacher?.fullName || hardcodedData.instructor.name}</h4>
                  <p className="text-indigo-600 font-medium mb-2">{teacher?.userName || hardcodedData.instructor.experience}</p>
                  <p className="text-gray-600">{teacher?.address || hardcodedData.instructor.bio}</p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                What You'll Learn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hardcodedData.whatYouLearn.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Course Highlights
              </h3>
              <div className="space-y-4">
                {hardcodedData.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Student Reviews
              </h3>

              {/* Review Form - Only for logged-in users */}
              {currentUser && (
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Write a Review</h4>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    rows="3"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || !reviewText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}

              {/* Top Reviews */}
              <div className="space-y-6">
                {getTopReviews().length > 0 ? (
                  getTopReviews().map((review) => (
                    <div key={review._id} className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex gap-4 mb-4">
                        <img
                          src="https://image.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-250nw-2281862025.jpg"
                          alt={review.userId?.fullName || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{review.userId?.fullName || "Anonymous"}</h5>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{review.text}</p>
                      
                      {/* Vote Buttons */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleUpvote(review._id)}
                          className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                        >
                          <ChevronUp className="w-5 h-5" />
                          <span>{review.upvotes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleDownvote(review._id)}
                          className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                        >
                          <ChevronDown className="w-5 h-5" />
                          <span>{review.downvotes?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>

              {/* Show All Reviews Button */}
              {reviews.length > 2 && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="w-full mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold"
                >
                  Show All Reviews ({reviews.length})
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Registration Form & Price */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 mb-6 text-white sticky top-6">
              <div className="text-center mb-6">
                <p className="text-blue-200 text-sm mb-2">Course Price</p>
                <div className="text-5xl font-bold mb-1">
                  {course ? new Intl.NumberFormat('vi-VN').format(course.price) : 0}
                </div>
                <p className="text-blue-200">VNĐ</p>
              </div>
              <button
                onClick={() => {
                  const height = Math.max(
                    document.body.scrollHeight,
                    document.documentElement.scrollHeight
                  );
                  window.scrollTo({ top: height, behavior: 'smooth' });
                }}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-50 transition"
              >
                Enroll Now
              </button>
            </div>

            {/* Registration Form Card */}
           <div ref={formRef} className="bg-white rounded-xl shadow-lg p-6 sticky top-80">
              {/* Tiêu đề */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {currentUser ? 'Confirm Registration' : 'Registration Form'}
              </h2>

              {/* Thông báo lỗi/thành công */}
              {message && (
                <div
                  className={`mb-6 border-l-4 p-4 ${
                    messageType === "error"
                      ? "bg-red-50 border-red-400 text-red-700"
                      : "bg-green-50 border-green-400 text-green-700"
                  }`}
                >
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* LOGIC ĐIỀU KIỆN MỚI */}
              {currentUser ? (
                // DÀNH CHO SINH VIÊN ĐÃ ĐĂNG NHẬP
                <div className="space-y-4">
                  <p className="text-gray-700">
                    You are logged in as <strong>{currentUser.userName || currentUser.id}</strong>.
                  </p>
                  <p className="text-gray-600">
                    You don't need to fill out the form again. Click 'Register Now' to proceed to payment.
                  </p>
                  <button
                    onClick={handleStudentSubmit} // Sử dụng hàm mới
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Processing..." : "Register Now"}
                  </button>
                </div>
              ) : (
                // DÀNH CHO KHÁCH (Biểu mẫu cũ)
                <form onSubmit={handleGuestSubmit} className="space-y-4"> {/* Sử dụng hàm mới */}
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username *
                    </label>
                    <input
                      type="text"
                      id="userName"
                      name="userName"
                      value={formData.userName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="johndoe"
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0912345678"
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Birthday *
                    </label>
                    <input
                      type="date"
                      id="birthday"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 ABC Street, District XYZ, City"
                    />
                  </div>


                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Processing..." : "Register Now"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* All Reviews Modal */}
        {showAllReviews && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">All Reviews ({reviews.length})</h3>
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {[...reviews].sort((a, b) => {
                  const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
                  const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
                  return bScore - aScore;
                }).map((review) => (
                  <div key={review._id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex gap-4 mb-4">
                      <img
                        src="https://image.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-250nw-2281862025.jpg"
                        alt={review.userId?.fullName || "User"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{review.userId?.fullName || "Anonymous"}</h5>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{review.text}</p>
                    
                    {/* Vote Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleUpvote(review._id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                      >
                        <ChevronUp className="w-5 h-5" />
                        <span>{review.upvotes?.length || 0}</span>
                      </button>
                      <button
                        onClick={() => handleDownvote(review._id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600"
                      >
                        <ChevronDown className="w-5 h-5" />
                        <span>{review.downvotes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && paymentUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">VNPay Sandbox Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 text-center">
                <p className="text-gray-700 mb-4">Quét QR hoặc mở liên kết để thanh toán VNPay (Sandbox).</p>
                <div className="flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(paymentUrl)}`}
                    alt="VNPay QR"
                    className="rounded shadow"
                  />
                </div>
                <div className="mt-4 break-all text-xs text-gray-500">
                  {paymentUrl}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Mở liên kết thanh toán
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(paymentUrl);
                    }}
                    className="w-full border py-2 rounded hover:bg-gray-50"
                  >
                    Sao chép liên kết
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseRegistration;
