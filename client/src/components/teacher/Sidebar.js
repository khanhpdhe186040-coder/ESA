import { useNavigate } from "react-router-dom";
import { Calendar, GraduationCap, BookOpen, Newspaper, HelpCircle, UserCircle } from "lucide-react";
export default function Sidebar() {
  const navigate = useNavigate();
  const items = [
    { icon: <UserCircle size={20}/>, text: "Profile", link: "/teacher/profile"},
    { icon: <Calendar size={20} />, text: "Teaching Schedule", link: "/teacher/schedule" },
    { icon: <GraduationCap size={20} />, text: "Teaching Classes", link: "/teacher/classes" },
    { icon: <BookOpen size={20} />, text: "Courses", link: "/teacher/courses" },
    { icon: <Newspaper size={20} />, text: "News", link: "/teacher/news" },
    { icon: <HelpCircle size={20} />, text: "Quiz Management", link: "/teacher/quizzes" }
  ];

  return (
    <div className="h-screen w-64 bg-blue-900 text-white flex flex-col shadow-lg">
      <div className="text-2xl font-bold p-4 border-b border-blue-700">Teacher Panel</div>
      <nav className="flex flex-col p-4 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition"
            onClick={() => navigate(item.link)}
          >
            {item.icon}
            <span className="text-sm">{item.text}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}