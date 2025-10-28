import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Ensure you have this package installed 
import { useNavigate } from "react-router-dom";
const RegisterClass = () => {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const studentId = jwtDecode(token).id;

    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/registerable-classes`
        );
        setClasses(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("Failed to load classes.");
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);
  const handleQuizClick = (courseId) => {
    if (courseId) {
      navigate(`/student/quiz/${courseId}`); // << Điều hướng đến trang quiz
    } else {
      alert("This class has no associated course to start a quiz.");
    }
  };
  
  const handleEnroll = async (classId) => {
    try {
      setEnrolling(true);
      const token = localStorage.getItem("token");
      
      console.log('Enrolling in class ID:', classId);
      
      console.log('Sending enrollment request for class:', classId);
      const response = await axios.post(
        `http://localhost:9999/api/student/register-class/${classId}`,
        {},  // Empty body since we're getting user from token
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true  // Important for sending cookies if using them
        }
      );
      
      if (response.data.success) {
        alert('Successfully enrolled in class!');
        // Update the UI to show the class as enrolled
        setClasses(prevClasses => 
          prevClasses.map(cls => 
            cls._id === classId 
              ? { ...cls, registered: true } 
              : cls
          )
        );
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      console.error('Error response data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in class';
      alert(`Error: ${errorMessage}`);
    } finally {
      setEnrolling(false);
    }
  };

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
      {/* Display loading state */}
      {loading && <p className="text-gray-500">Loading classes...</p>}
      {/* Display error message if any */}
      {error && <p className="text-red-500">{error}</p>}
      {/* Display fetched classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(classes) ? classes : [])
          .filter(
            (cls) =>
              (cls.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
              (cls.courseName?.toLowerCase() || "").includes(
                search.toLowerCase()
              )
          )
          .map((cls) => (
            <div
              key={cls._id}
              className="p-4 border rounded shadow hover:shadow-lg transition-shadow"
            >
              <div className="mb-4 min-h-[200px]">
                <h2 className="text-xl font-semibold">{cls.name}</h2>
                <p>
                  <strong>Course:</strong> {cls.name}
                </p>
                <p>
                  <strong>Teachers:</strong> {cls.teachers}
                </p>
                <p>
                  <strong>Schedule:</strong>{" "}
                  {Array.isArray(cls.schedule) && cls.schedule.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {cls.schedule.map((s, idx) => (
                        <li key={idx}>
                          {s.weekday}: {s.from} - {s.to}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No schedule</span>
                  )}
                </p>
                <p>
                  <strong>Capacity:</strong> {cls.capacity} (Registered Students:{" "}
                  {cls.studentsCount})
                </p>
                <p className="mb-4">
                  <strong>Status:</strong> {cls.status}
                </p>
              </div>
              {cls.registered ? (
         <>
         <button
           className="bg-red-600 text-white px-4 py-2 rounded w-1/2"
           disabled
         >
           Enrolled
         </button>
         {/* NÚT QUIZ MỚI */}
         <button
           className="bg-green-600 text-white px-4 py-2 rounded w-1/2 hover:bg-green-700"
           onClick={() => handleQuizClick(cls.courseId)}
         >
           Quiz
         </button>
       </>           
          ) : (
                <button
                  className="left-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => handleEnroll(cls._id)}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll'}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default RegisterClass;
