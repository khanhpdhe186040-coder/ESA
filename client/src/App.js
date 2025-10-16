import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Teacher
import TeacherLayout from "./layouts/TeacherLayout";
import Courses from "./pages/teacher/Courses";
import TeachingSchedule from "./pages/teacher/TeachingSchedule";
import TeachingClass from "./pages/teacher/TeachingClass";
import TeachingClassDetails from "./pages/teacher/TeachingClassDetails";
import TeachingGradeDetails from "./pages/teacher/TeachingGradeDetails";
import QuizManagementPage from './pages/teacher/QuizManagement'; 
import QuizForm from './pages/teacher/QuizForm';
import QuestionManagementPage from './pages/teacher/QuestionManagement';
import QuestionForm from "./pages/teacher/QuestionForm";
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
import HomePage from './pages/HomePage';
import CourseDetailPage from './pages/CourseDetailPage';
// Admin
import Dashboard from "./pages/admin/DashBoard";
import CourseManagement from "./pages/admin/CourseManagement";
import ClassesManagement from "./pages/admin/ClassesManagement";
import UserManagement from "./pages/admin/UserManagement";
import LoginPage from "./Login/Login";
import ProtectedRoute from "./Login/ProtectedRoute";
import NewsAdd from "./components/general/NewsAdd";
import AdminLayout from "./layouts/AdminLayout";
function App() {
  return (
    <Router>
      <Routes>
        
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

        {/* Quản lý danh sách các Quiz */}
          <Route path="quizzes" element={<QuizManagementPage />} />
          <Route path="quizzes/new" element={<QuizForm />} /> 
          <Route path="quizzes/edit/:quizId" element={<QuizForm />} />
          <Route path="quizzes/:quizId/questions" element={<QuestionManagementPage />} />
          
          {/* Quản lý các Question */}
          <Route path="quizzes/:quizId/questions/new" element={<QuestionForm />} />
          <Route path="quizzes/questions/edit/:questionId" element={<QuestionForm />} />
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
              <NewsAdd />
            </ProtectedRoute>
          }
        />



        {/* Student Layout */}
        <Route path="/student" element={<StudentLayout />}>
          
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="my-classes" element={<MyClasses />} />
          <Route path="register-class" element={<RegisterClass />} />
          <Route path="my-classes/:classId" element={<ClassDetails />} />

          <Route path="grade" element={<StudentGrades />} />
          <Route path="grade/:classId" element={<GradeDetails />} />
          <Route path="/student/register-class" element={<RegisterClass />} />
          <Route path="/student/quiz/:courseId" element={<Quiz />} />
          
        </Route>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:courseId" element={<CourseDetailPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
