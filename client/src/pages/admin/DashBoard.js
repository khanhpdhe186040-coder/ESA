import { useEffect, useState } from "react";
import axios from "axios";
import { Users, UserPlus, BookOpen, CalendarCheck } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();

  const [totals, setTotals] = useState({
    users: 0,
    teachers: 0,
    students: 0,
    courses: 0,
    classes: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        // song song 3 request
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [uRes, cRes, clRes] = await Promise.all([
          axios.get("http://localhost:9999/api/users", config),
          axios.get("http://localhost:9999/api/courses", config),
          axios.get("http://localhost:9999/api/classes", config),
        ]);

        const users = uRes.data.data || [];

        setTotals({
          users: users.length,
          courses: cRes.data.data.length,
          classes: clRes.data.data.length,
        });
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      }
    })();
  }, []);

  /* ---------- cards & quick actions ---------- */
  const stats = [
    {
      label: "Total Users",
      value: totals.users,
      color: "bg-blue-600",
      icon: <Users className="h-6 w-6 text-white" />,
    },
    {
      label: "Courses",
      value: totals.courses,
      color: "bg-orange-600",
      icon: <BookOpen className="h-6 w-6 text-white" />,
    },
    {
      label: "Classes",
      value: totals.classes,
      color: "bg-teal-600",
      icon: <CalendarCheck className="h-6 w-6 text-white" />,
    },
  ];

  const actions = [
    {
      label: "Add New User",
      icon: <UserPlus className="h-5 w-5 text-blue-600" />,
      link: "/admin/users",
    },
    {
      label: "Create Course",
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      link: "/admin/courses",
    },
    {
      label: "Schedule Class",
      icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
      link: "/admin/classes",
    },
  ];

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Overview of your learning management system
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-lg p-4 flex items-center justify-between shadow ${s.color}`}
            >
              <div>
                <p className="text-sm text-white/80">{s.label}</p>
                <p className="text-2xl font-bold text-white">{s.value}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white p-6 rounded-lg shadow border max-w-xl">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <ul className="space-y-4">
            {actions.map((a) => (
              <li
                key={a.label}
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => nav(a.link)}
              >
                <span className="mr-3">{a.icon}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
