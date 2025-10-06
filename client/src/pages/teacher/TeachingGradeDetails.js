// src/pages/student/GradeDetails.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const TeachingGradeDetails = () => {
  const { classId } = useParams();
  const [gradeDetails, setGradeDetails] = useState(null);
  const token = localStorage.getItem("token");
  const studentId = jwtDecode(token).id;

  useEffect(() => {
    // Mock API response theo classId
    const mockDetails = {
      "id": "1",
      "studentId": "u4",
      "classId": "c1",
      "score": {
        "listening": 8.5,
        "reading": 7.0,
        "writing": 6.5,
        "speaking": 7.5
      },
      "comment": "Làm bài tốt, chú ý phần speaking."
    };

    setGradeDetails(mockDetails[classId] || null);
  }, [classId]);

  if (!gradeDetails) {
    return <div className="p-6 text-gray-600">No grade details found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">
        Grade Details - {gradeDetails.className}
      </h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Skill</th>
            <th className="border p-2">Score</th>
            <th className="border p-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {gradeDetails.skills.map((skill, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border p-2">{skill.name}</td>
              <td className="border p-2">{skill.score}</td>
              <td className="border p-2 italic">
                {skill.comment || "No comment"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeachingGradeDetails;
