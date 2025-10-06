import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Ensure you have this package installed

const Grades = () => {
  const [gradeList, setGradeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const viewDetailsHandler = (classId) => {
    navigate(`/student/grade/${classId}`);
  };

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        const studentId = jwtDecode(token).id;
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/grades`
        );
        
        // If API response is { data: [...] }, use response.data.data
        // If API response is just [...], use response.data
        const grades = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        
        setGradeList(grades);
      } catch (err) {
        console.error("Error fetching grades:", err);
        setError("Failed to load grades.");
        setGradeList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">My Grades</h1>
        <div className="text-center py-10">Loading grades...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">My Grades</h1>
        <div className="text-center py-10 text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-800">My Grades</h1>
      <table className="w-full text-sm border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-left">Class</th>
            <th className="p-2 border text-left">Course</th>
            <th className="p-2 border text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(gradeList) && gradeList.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center p-4 text-gray-500">
                No grades available.
              </td>
            </tr>
          ) : (
            (Array.isArray(gradeList) ? gradeList : []).map((grade, idx) => (
              <tr key={grade._id || idx} className="hover:bg-gray-50">
                <td className="p-2 border text-left">{grade.className}</td>
                <td className="p-2 border text-left">{grade.courseName}</td>
                <td className="p-2 border text-left">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => viewDetailsHandler(grade.classId)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Grades;