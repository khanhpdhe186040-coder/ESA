import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react"; // <-- Thêm icon X

const EnrollmentRequests = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  
  // 1. THÊM STATE CHO NOTIFICATION
  const [notification, setNotification] = useState({ type: '', message: '' });
  
  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:9999/api/teacher/enrollment-requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (err) {
      setError("Failed to load enrollment requests.");
    } finally {
      setLoading(false);
    }
  };

  // (Giữ nguyên useEffect fetchRequests)
  useEffect(() => {
    fetchRequests();
  }, [token]);

  // 2. THÊM useEffect ĐỂ TỰ ĐỘNG ẨN THÔNG BÁO
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAction = async (action, classId, studentId) => {
    setProcessing({ classId, studentId });
    try {
      const endpoint = action === 'approve' 
        ? `approve-enrollment` 
        : `reject-enrollment`;
        
      await axios.post(
        `http://localhost:9999/api/teacher/${endpoint}/${classId}/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 3. THAY THẾ ALERT BẰNG setNotification
      setNotification({ type: 'success', message: `Student ${action}d successfully!` });
      
      // Tải lại danh sách
      fetchRequests(); 

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      // 4. THAY THẾ ALERT BẰNG setNotification
      setNotification({ type: 'error', message: `Action failed: ${errorMessage}` });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <p className="p-6">Loading requests...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Enrollment Requests</h1>
      
      {/* 5. HIỂN THỊ JSX CỦA NOTIFICATION */}
      {notification.message && (
        <div 
          className={`p-4 mb-4 rounded-md flex justify-between items-center ${
            notification.type === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ type: '', message: '' })}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      
      {classes.length === 0 && (
        <p className="text-gray-500">No pending enrollment requests.</p>
      )}

      <div className="space-y-6">
        {classes.map(cls => (
          <div key={cls._id} className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{cls.name}</h2>
            <p className="text-sm text-gray-600 mb-3">Course: {cls.courseId?.name}</p>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Student Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cls.pendingStudents.map(student => (
                  <tr key={student._id} className="border-t">
                    <td className="p-2">{student.fullName}</td>
                    <td className="p-2">{student.email}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleAction('approve', cls._id, student._id)}
                        disabled={processing?.studentId === student._id}
                        className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction('reject', cls._id, student._id)}
                        disabled={processing?.studentId === student._id}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 ml-2 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrollmentRequests;