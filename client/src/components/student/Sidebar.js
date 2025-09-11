import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaClipboardList,
  FaGraduationCap,
  FaBookOpen
} from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    // { name: "Student Panel", icon: <FaHome />, path: "/student" },
    { name: "My Classes", icon: <FaBookOpen />, path: "/student/my-classes" },
    { name: "Schedule", icon: <FaCalendarAlt />, path: "/student/schedule" },
    {
      name: "Register Class",
      icon: <FaClipboardList />,
      path: "/student/register-class",
    },
    { name: "Grade", icon: <FaGraduationCap />, path: "/student/grade" },
  ];

  return (
    <div
      className={`bg-blue-900 text-white h-screen p-4 flex flex-col transition-all duration-300 ${
        isOpen ? "w-60" : "w-16"
      } md:w-60`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-6 text-white text-xl md:hidden self-end"
      >
        {isOpen ? "✖" : "☰"}
      </button>
      <h1>Student Panel</h1>
      <ul className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center p-2 rounded hover:bg-blue-600 transition-colors ${
                location.pathname === item.path ? "bg-blue-700" : ""
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className={`${isOpen ? "block" : "hidden"} md:block`}>
                {item.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
