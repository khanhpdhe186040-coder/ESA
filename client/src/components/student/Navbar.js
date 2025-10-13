import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

const pageTitles = {
  "/": "Home",
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
  const token = localStorage.getItem("token"); // Kiểm tra đăng nhập

  // Lấy tiêu đề trang động
  let pageTitle = pageTitles[location.pathname] || "ESA";
  if (location.pathname.startsWith('/course/')) {
      pageTitle = "Course Details";
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center relative">
      {/* Page title */}
      <div className="text-gray-600 text-base font-semibold">{pageTitle}</div>

      {/* Dựa vào token để hiển thị nút phù hợp */}
      {token ? (
        // Khi đã đăng nhập
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FaUserCircle className="text-2xl" />
            <span>Student</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      ) : (
        // Khi chưa đăng nhập
        <div className="flex items-center gap-4">
            <Link to="/login" className="font-medium text-gray-600 hover:text-indigo-600">
                Login
            </Link>
            <Link to="/register" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Register
            </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
