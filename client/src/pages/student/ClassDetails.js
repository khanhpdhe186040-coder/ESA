import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);

  // Fetch class details
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

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setScheduleLoading(true);
        const response = await axios.get(
          `http://localhost:9999/api/schedule/${classId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSchedule(response.data.data || []);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        // Don't show error to user if schedule fetch fails, just log it
      } finally {
        setScheduleLoading(false);
      }
    };

    if (classId) {
      fetchSchedule();
    }
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
                <span> No schedule</span>
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
              <th className="border px-4 py-3 text-left w-16">#</th>
              <th className="border px-4 py-3 text-left">Image</th>
              <th className="border px-4 py-3 text-left">First Name</th>
              <th className="border px-4 py-3 text-left">Middle Name</th>
              <th className="border px-4 py-3 text-left">Last Name</th>
              <th className="border px-4 py-3 text-left">Email</th>
              <th className="border px-4 py-3 text-left">Birth Date</th>
            </tr>
            </thead>
            <tbody>
            {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="border px-4 py-3">{student.image || 'No Image'}</td>
                  {(() => {
                    const nameParts = student.name.trim().split(/\s+/);
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                    const middleName = nameParts.length > 2
                        ? nameParts.slice(1, nameParts.length - 1).join(' ')
                        : nameParts.length === 2 ? '' : '';

                    return (
                        <>
                          <td className="border px-4 py-3 font-semibold text-blue-700">
                            {firstName}
                          </td>
                          <td className="border px-4 py-3 font-semibold text-blue-700">
                            {middleName}
                          </td>
                          <td className="border px-4 py-3 font-semibold text-blue-700">
                            {lastName}
                          </td>
                        </>
                    );
                  })()}
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

        {/* Schedule Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Class Schedule</h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {scheduleLoading ? (
              <div className="p-6 text-center text-gray-500">Loading schedule...</div>
            ) : schedule.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.map((s, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {s.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.slot.from} - {s.slot.to}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.room || classData?.room || 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">No schedule available</div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ClassDetails;
