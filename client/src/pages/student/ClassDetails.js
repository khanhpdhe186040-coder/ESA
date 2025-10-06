import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("No token found");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:9999/api/student/my-classes/${classId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClassData(response.data);
        setStudents(response.data.students || []);
      } catch (error) {
        console.error(
          "Error fetching class details:",
          error.response?.status,
          error.response?.data
        );
        setError(
          `Failed to fetch class details. Status: ${error.response?.status || "Unknown"
          }, Message: ${error.response?.data?.message || error.message}`
        );
        setClassData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 text-center">
        {error}.{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Log in again
        </a>
        . Check the console for details.
      </div>
    );
  }

  if (!classData) {
    return <div className="p-6 text-gray-600">No class details found.</div>;
  }

  // Handle teacher as a string or array
  const teachers =
    typeof classData.teacher === "string"
      ? classData.teacher.split(", ").map((name) => ({ fullName: name.trim() }))
      : Array.isArray(classData.teachers)
        ? classData.teachers
        : [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Class Details</h1>

      <div className="bg-white shadow rounded p-4 mb-6">
        <p>
          <strong>Class:</strong> {classData.name}
        </p>
        <p>
          <strong>Teacher:</strong>{" "}
          {teachers.length > 0
            ? teachers.map((t) => t.fullName).join(", ")
            : "N/A"}
        </p>
        <div>
          <strong>Schedule:</strong>
          {Array.isArray(classData.schedule) &&
            classData.schedule.length > 0 ? (
            <ul className="list-disc list-inside">
              {classData.schedule.map((s, idx) => (
                <li key={idx}>
                  {s.weekday}: {s.from} - {s.to}
                </li>
              ))}
            </ul>
          ) : (
            <span>No schedule</span>
          )}
        </div>
        <p>
          <strong>Room:</strong> {classData.room || "N/A"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="text-green-600">{classData.status}</span>
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Student List</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-3 text-left">Name</th>
              <th className="border px-4 py-3 text-left">Email</th>
              <th className="border px-4 py-3 text-left">Birth Date</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="border px-4 py-3 font-semibold text-blue-700">
                  {student.name}
                </td>
                <td className="border px-4 py-3">{student.email}</td>
                <td className="border px-4 py-3">{student.birthday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => navigate("/student/my-classes")}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to My Classes
      </button>
    </div>
  );
};

export default ClassDetails;
