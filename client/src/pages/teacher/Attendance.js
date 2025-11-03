import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Base API URL 
const API_BASE_URL = 'http://localhost:9999/api/attendance';

const statusOptions = ['present', 'absent', 'late', 'excused'];

// Function to decode JWT manually (due to potential 'jwt-decode' resolution issues)
const decodeJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Manual JWT Decode Failed:", e);
        return null;
    }
};

// Notification component for displaying success/error messages
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;

    const baseStyle = "fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white font-semibold z-50 transition-opacity duration-300";
    const typeStyle = type === 'success' ? 'bg-green-600' : 'bg-red-600';

    return (
        <div className={`${baseStyle} ${typeStyle}`}>
            {message}
            <button onClick={onClose} className="ml-4 font-bold opacity-75 hover:opacity-100">&times;</button>
        </div>
    );
};

// Utility function to get background color based on status (Used for Select element)
const getRowBackgroundColor = (status) => {
    switch (status) {
        case 'present':
            return 'bg-green-50 hover:bg-green-100'; 
        case 'absent':
            return 'bg-red-50 hover:bg-red-100';    
        case 'late':
            return 'bg-yellow-50 hover:bg-yellow-100'; 
        case 'excused':
            return 'bg-blue-50 hover:bg-blue-100';   
        default:
            return 'bg-white hover:bg-gray-50';
    }
};

export default function AttendancePage() {
    const { scheduleId } = useParams();
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' }); 

    // Function to fetch attendance data
    const fetchAttendance = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        try {
            // GET /api/attendance/schedule/:scheduleId
            const response = await axios.get(`${API_BASE_URL}/schedule/${scheduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.data) {
                setAttendanceData(response.data.data);
            } else if (response.data.data === null || response.data.data.studentsAttendance.length === 0) {
                 setAttendanceData({
                    _id: 'initial', 
                    classId: response.data.data?.classId || 'N/A',
                    studentsAttendance: [],
                 });
            } else {
                setError('Failed to fetch attendance data.');
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError(err.response?.data?.message || 'Failed to fetch attendance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [scheduleId]);

    const handleStatusChange = (index, newStatus) => {
        const newStudentsAttendance = [...attendanceData.studentsAttendance];
        newStudentsAttendance[index].status = newStatus;
        setAttendanceData(prev => ({ ...prev, studentsAttendance: newStudentsAttendance }));
    };

    const handleCommentChange = (index, newComment) => {
        const newStudentsAttendance = [...attendanceData.studentsAttendance];
        newStudentsAttendance[index].comment = newComment;
        setAttendanceData(prev => ({ ...prev, studentsAttendance: newStudentsAttendance }));
    };

    const handleSave = async () => {
        if (!attendanceData || attendanceData.studentsAttendance.length === 0) return;

        setIsSaving(true);
        setError(null);
        setNotification({ message: '', type: '' });
        const token = localStorage.getItem("token");

        try {
            const payload = {
                studentsAttendance: attendanceData.studentsAttendance.map(item => ({
                    studentId: item.studentId._id, 
                    status: item.status,
                    comment: item.comment
                }))
            };

            await axios.put(`${API_BASE_URL}/${attendanceData._id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotification({ message: 'Attendance saved successfully!', type: 'success' });
            
            setTimeout(() => setNotification({ message: '', type: '' }), 3000);

        } catch (err) {
            console.error('Error saving attendance:', err);
            const errMsg = err.response?.data?.message || 'Failed to save attendance.';
            setError(errMsg);
            setNotification({ message: errMsg, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="text-center py-10 text-lg font-medium">Loading attendance data...</div>;
    if (error && !notification.message) return <div className="text-center py-10 text-red-600 text-lg font-medium">Error: {error}</div>;
    if (!attendanceData || attendanceData.studentsAttendance.length === 0) {
         return (
             <div className="text-center py-10 text-gray-600 text-lg font-medium">
                 No students registered for this class or no attendance record found.
             </div>
         );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-800">Class Attendance</h2>
            <p className="text-gray-500">Schedule ID: <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{scheduleId}</span></p>

            {/* Error Message Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            <div className="flex justify-end space-x-3">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition duration-150 ${
                        isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    } flex items-center`}
                >
                    {isSaving ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : 'Save Attendance'}
                </button>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/3">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-1/4">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-auto">Comment (Reason for absence/tardiness)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceData.studentsAttendance.map((item, index) => (
                            <tr key={item.studentId._id} className="hover:bg-gray-50 transition duration-100"> 
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {item.studentId.fullName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(index, e.target.value)}
                                        className={`mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm ${getRowBackgroundColor(item.status)}`}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        value={item.comment || ''}
                                        onChange={(e) => handleCommentChange(index, e.target.value)}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md p-2"
                                        placeholder="Add comment..."
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ message: '', type: '' })} 
            />
        </div>
    );
}
