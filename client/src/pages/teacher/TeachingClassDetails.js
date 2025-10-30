import StudentList from "../teacher/StudentList";
import Grades from "../teacher/Grades";
import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {ClipboardPenLine, UsersRound} from "lucide-react";
import axios from "axios";

const TeachingClassDetails = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("students");
    const [classData, setClassData] = useState(null);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const {classId, teacherId} = useParams();

    const [schedule, setSchedule] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);

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
                        headers: {Authorization: `Bearer ${token}`},
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
    const fetchClassData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:9999/api/teacher/${teacherId}/classes/${classId}`,
                {
                    headers: {Authorization: `Bearer ${token}`}
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
                headers: {Authorization: `Bearer ${token}`}
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

            <button
                onClick={() => navigate("/teacher/" + teacherId + "/classes/" + classId + "/material")}
                className="my-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Class Material
            </button>
            {/* Tab Content */}
            <div className="flex mb-4">
                <button
                    className={`flex ${activeTab === "students" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-900"} px-4 py-2 rounded mr-4`}
                    onClick={() => setActiveTab("students")}
                >
                    <UsersRound/>
                    <h2 className="text-xl font-semibold ml-2">Students</h2>
                </button>
                <button
                    className={`flex ${activeTab === "grades" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-900"} px-4 py-2 rounded mr-4`}
                    onClick={() => setActiveTab("grades")}
                >
                    <ClipboardPenLine/>
                    <h2 className="text-xl font-semibold ml-2">Grades</h2>
                </button>
            </div>

            {activeTab === "students" && (
                <StudentList students={classData?.students}/>
            )}

            {activeTab === "grades" && (
                <Grades grades={grades} onGradeUpdate={handleGradeUpdate}/>
            )}

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

export default TeachingClassDetails;