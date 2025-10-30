import React, { useState } from "react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaClipboardCheck,
  FaCheckCircle,
} from "react-icons/fa";

const StudentDashboard = () => {
  const [stats] = useState({
    fullName: "Nguyen Van Luong",
    studentId: "ST123456",
    totalClasses: 5,
    averageScore: 8.2,
    attendanceCount: 42,
    completedCourses: 3,
  });

  const cards = [
    {
      title: "Registered Classes",
      value: stats.totalClasses,
      icon: <FaBookOpen />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Average Score",
      value: stats.averageScore,
      icon: <FaGraduationCap />,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Attendance  ",
      value: stats.attendanceCount,
      icon: <FaClipboardCheck />,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Completed Courses",
      value: stats.completedCourses,
      icon: <FaCheckCircle />,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 mb-8 shadow-md">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {stats.fullName} 👋
        </h1>
        <p className="text-sm">Student ID: {stats.studentId}</p>
        <p className="mt-2 text-base">
          Here’s a quick overview of your learning progress.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-5 shadow-sm border hover:shadow-md transition ${card.color}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{card.icon}</div>
              <div>
                <p className="text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
