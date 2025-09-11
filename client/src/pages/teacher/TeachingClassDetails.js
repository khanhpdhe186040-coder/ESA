import StudentList from "../teacher/StudentList";
import Grades from "../teacher/Grades";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClipboardPenLine, UsersRound } from "lucide-react";
import axios from "axios";

const TeachingClassDetails = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [classData, setClassData] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { classId, teacherId } = useParams();

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:9999/api/teacher/${teacherId}/classes/${classId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log("Class Data Response:", response.data);

      if (response.data && response.data.success) {
        setClassData(response.data.data);
      } else {
        console.error("Failed to fetch class data:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:9999/api/teacher/${teacherId}/classes/${classId}/grades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Grades Response:", response.data);

      if (response.data && response.data.success) {
        setGrades(response.data.data);
      } else {
        console.error("Failed to fetch grades:", response.data.message);
        setGrades([]);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    }
  };

  // Callback function to refresh grades after update
  const handleGradeUpdate = () => {
    fetchGrades();
  };

  useEffect(() => {
    if (classId) {
      fetchClassData();
      fetchGrades();
    }
  }, [classId, teacherId]);

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Loading class details...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Class Details</h1>

      <div className="bg-white shadow rounded p-4 mb-6">
        <p>
          <strong>Class:</strong> {classData?.name}
        </p>
        <div className="mb-2">
          <strong>Teacher:</strong>
          {classData?.teachers?.map((t) => (
            <div key={t.id} className="ml-4 mt-1">
              <span className="font-semibold text-gray-700">{t.name}</span>
              <span className="text-gray-500 ml-2">(Email: {t.email || 'N/A'})</span>
            </div>
          ))}
        </div>
        <p>
          <strong>Start date:</strong> {classData?.startDate}
        </p>
        <p>
          <strong>Course:</strong> {classData?.course}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="text-green-600">{classData?.status}</span>
        </p>
      </div>

      {/* Tab Content */}
      <div className="flex mb-4">
        <button
          className={`flex ${activeTab === "students" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-900"} px-4 py-2 rounded mr-4`}
          onClick={() => setActiveTab("students")}
        >
          <UsersRound />
          <h2 className="text-xl font-semibold ml-2">Students</h2>
        </button>
        <button
          className={`flex ${activeTab === "grades" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-900"} px-4 py-2 rounded mr-4`}
          onClick={() => setActiveTab("grades")}
        >
          <ClipboardPenLine />
          <h2 className="text-xl font-semibold ml-2">Grades</h2>
        </button>
      </div>

      {activeTab === "students" && (
        <StudentList students={classData?.students} />
      )}

      {activeTab === "grades" && (
        <Grades grades={grades} onGradeUpdate={handleGradeUpdate} />
      )}
    </div>
  );
};

export default TeachingClassDetails;