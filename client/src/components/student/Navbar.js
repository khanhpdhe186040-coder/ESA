import { useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const pageTitles = {
  "/dashboard": "Home",
  "/student/schedule": "Schedule",
  "/student/register-class": "Register Class",
  "/student/results": "Academic Results",
  "/student/attendance": "Attendance",
  "/student/profile": "Profile",
  "/student/exam-schedule": "Exam Schedule",
  "/student/grade": "Grade",
  "/student/my-classes": "My Classes",
  "/student/class-details": "Class Details",
  "/student/attendance-list": "Attendance List",
  "/student/grades": "Grades",
  "/student/dashboard": "Student Dashboard",
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || "Student Portal";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center relative">
      {/* Page title */}
      <div className="text-gray-600 text-base font-semibold">{pageTitle}</div>

      <div className="flex items-center gap-6">
        {/* Static user info */}
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <FaUserCircle className="text-2xl" />
          <span>Student</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
