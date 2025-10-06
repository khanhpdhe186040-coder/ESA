import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Ensure you have this package installed

const GradeDetails = () => {
  const { classId } = useParams();
  const [gradeDetails, setGradeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGradeDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const studentId = jwtDecode(token).id;
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/grades/class/${classId}` // Use classId from URL params
        );
        // Transform API response to match UI needs
        const dataArr = response.data?.data;
        if (Array.isArray(dataArr) && dataArr.length > 0) {
          const grade = dataArr[0];
          const skills = Object.entries(grade.score || {}).map(
            ([name, score]) => ({
              name,
              score,
            })
          );
          setGradeDetails({
            className: grade.classId?.name || "",
            courseName: grade.classId?.courseId?.name || "",
            skills,
            comment: grade.comment || [],
          });
        } else {
          setGradeDetails(null);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching grade details:", err);
        setError("Failed to load grade details.");
        setLoading(false);
      }
    };

    fetchGradeDetails();
  }, [classId]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading grade details...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  if (!gradeDetails) {
    return <div className="p-6 text-gray-500">No grade details found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Grade Details - Class: {gradeDetails.className}
      </h1>
      <h2 className="text-lg mb-2 text-gray-700">
        Course: {gradeDetails.courseName}
      </h2>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Skill</th>
            <th className="border p-2">Grades</th>
          </tr>
        </thead>
        <tbody>
          {gradeDetails.skills.map((skill, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border p-2">{skill.name}</td>
              <td className="border p-2">{skill.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        {gradeDetails.comment}
      </div>
    </div>
  );
};

export default GradeDetails;
