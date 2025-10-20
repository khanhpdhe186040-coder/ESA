import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./contexts/SocketContext";

// Teacher
import TeacherLayout from "./layouts/TeacherLayout";
import Courses from "./pages/teacher/Courses";
import TeachingSchedule from "./pages/teacher/TeachingSchedule";
import TeachingClass from "./pages/teacher/TeachingClass";
import TeachingClassDetails from "./pages/teacher/TeachingClassDetails";
import TeachingGradeDetails from "./pages/teacher/TeachingGradeDetails";

// Student
import StudentLayout from "./layouts/StudentLayout";
import StudentSchedule from "./pages/student/StudentSchedule";

import RegisterClass from "./pages/student/RegisterClass";
import MyClasses from "./pages/student/MyClasses";
import ClassDetails from "./pages/student/ClassDetails";

import StudentGrades from "./pages/student/Grades";
import GradeDetails from "./pages/student/GradeDetails";
import StudentDashboard from "./pages/student/StudentDashboard";
import Quiz from './pages/student/Quiz';
// Admin
import Dashboard from "./pages/admin/DashBoard";
import CourseManagement from "./pages/admin/CourseManagement";
import ClassesManagement from "./pages/admin/ClassesManagement";
import UserManagement from "./pages/admin/UserManagement";
import LoginPage from "./Login/Login";
import ProtectedRoute from "./Login/ProtectedRoute";
import NewsAdd from "./components/admin/NewsAdd";
import AdminLayout from "./layouts/AdminLayout";
import NewsList from "./components/general/NewsList";
import NewsDetail from "./components/general/NewsDetail";
function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Teacher Layout */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="courses" element={<Courses />} />
          <Route path="schedule" element={<TeachingSchedule />} />
          <Route path="classes" element={<TeachingClass />} />
          <Route
            path=":teacherId/classes/:classId"
            element={<TeachingClassDetails />}
          />
          <Route
            path="grades/class/:classId/student/:studentId"
            element={<TeachingGradeDetails />}
          />
        </Route>

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute>
              <CourseManagement />{" "}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute>
              <ClassesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        {/* Admin news routes under AdminLayout */}
        <Route
          path="/admin/news"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <NewsAdd />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/news/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <NewsAdd />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/news/list"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <NewsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/news/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <NewsDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/news/list/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <NewsDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Student Layout */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="news" element={<NewsList />} />
          <Route path="news/:id" element={<NewsDetail />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="register-class" element={<RegisterClass />} />
          <Route path="my-classes/:classId" element={<ClassDetails />} />

          <Route path="grade" element={<StudentGrades />} />
          <Route path="grade/:classId" element={<GradeDetails />} />
          <Route path="/student/register-class" element={<RegisterClass />} />
          <Route path="/student/quiz/:courseId" element={<Quiz />} />
        </Route>
        {/* Teacher Layout additions */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="news" element={<NewsList />} />
          <Route path="news/:id" element={<NewsDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
