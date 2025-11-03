import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

// Hàm helper để format ngày
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('vi-VN'); // Format DD/MM/YYYY
};

const RegisterClass = () => {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(null); // Dùng null hoặc classId
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in.");
      setLoading(false);
      return;
    }
    
    const studentId = jwtDecode(token).id;

    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/registerable-classes`
        );
        setClasses(response.data);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to load classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);
  
  
  const handleEnroll = async (classId) => {
    try {
      setEnrolling(classId); // Đặt ID của lớp đang enroll
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        `http://localhost:9999/api/student/register-class/${classId}`,
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert('Enrollment request sent! Please wait for teacher approval.');
        // Cập nhật UI thành "Pending"
        setClasses(prevClasses => 
          prevClasses.map(cls => 
            cls._id === classId 
              ? { ...cls, enrollmentStatus: 'pending' } 
              : cls
          )
        );
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in class';
      alert(`Error: ${errorMessage}`);
    } finally {
      setEnrolling(null); // Hoàn tất
    }
  };

  // Hàm render nút bấm dựa trên trạng thái
  const renderEnrollButton = (cls) => {
    const isExpired = new Date(cls.endDate) < new Date();
    
    if (isExpired) {
      return (
        <button className="bg-gray-400 text-white px-4 py-2 rounded w-full" disabled>
          Expired
        </button>
      );
    }

    if (cls.enrollmentStatus === 'enrolled') {
      return (
        <button className="bg-green-600 text-white px-4 py-2 rounded w-full" disabled>
          Enrolled
        </button>
      );
    }
    
    if (cls.enrollmentStatus === 'pending') {
      return (
        <button className="bg-yellow-500 text-white px-4 py-2 rounded w-full" disabled>
          Pending Approval
        </button>
      );
    }

    return (
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        onClick={() => handleEnroll(cls._id)}
        disabled={enrolling === cls._id} // Chỉ vô hiệu hóa nút được bấm
      >
        {enrolling === cls._id ? 'Enrolling...' : 'Enroll'}
      </button>
    );
  };

  const filteredClasses = (Array.isArray(classes) ? classes : [])
    .filter(
      (cls) =>
        (cls.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (cls.courseName?.toLowerCase() || "").includes(search.toLowerCase())
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Register for Classes
      </h1>
      <input
        type="text"
        placeholder="Search classes by name or course..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded w-full md:w-1/2"
      />
      {loading && <p className="text-gray-500">Loading classes...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && filteredClasses.length === 0 && (
         <p className="text-gray-500">No classes found for the courses you are enrolled in.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
            <div
              key={cls._id}
              className="p-4 border rounded shadow hover:shadow-lg transition-shadow flex flex-col justify-between" // <-- Thêm flex
            >
              {/* Phần thông tin (chiếm phần lớn) */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{cls.name}</h2>
                <p><strong>Course:</strong> {cls.courseName}</p>
                <p><strong>Teachers:</strong> {cls.teachers}</p>
                <p><strong>Capacity:</strong> {cls.studentsCount} / {cls.capacity}</p>
                <p><strong>Status:</strong> {cls.status}</p>
                
                {/* HIỂN THỊ NGÀY */}
                <p><strong>Start Date:</strong> {formatDate(cls.startDate)}</p>
                <p><strong>End Date:</strong> {formatDate(cls.endDate)}</p>

                <p><strong>Schedule:</strong></p>
                {Array.isArray(cls.schedule) && cls.schedule.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {cls.schedule.map((s, idx) => (
                      <li key={idx}>
                        {s.weekday}: {s.from} - {s.to} ({s.room})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>No schedule</span>
                )}
              </div>
              
              {/* Phần nút bấm (luôn ở dưới) */}
              <div className="mt-auto"> 
                {renderEnrollButton(cls)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RegisterClass;