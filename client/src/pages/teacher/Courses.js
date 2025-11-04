import { useEffect, useState } from "react";
import { Plus, Search, Eye } from "lucide-react";

export default function Courses() {
  // Get courses data from CourseService
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses data from CourseService
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:9999/api/courses/public", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        if (data.success) {
          setCourses(data.data);
        } else {
          console.error("Failed to fetch courses:", data.message);
          setError(data.message || "Failed to fetch courses");
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError(error.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses(); // Actually call the function
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = status === "all" || course.status === status;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        <div className="text-center py-10">
          <div className="text-gray-500">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        <div className="text-center py-10">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
          <button className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded-md font-semibold shadow hover:bg-blue-600">
            <Plus className="w-5 h-5" /> Add Course
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="border border-gray-300 rounded pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="">
          <table className="min-w-full bg-white shadow-md border border-gray-200">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Price(VND)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {filteredCourses.map((course) => {
                const bgColor =
                  course?.status === "active" ? "bg-green-100" : "bg-red-100";
                const textColor =
                  course?.status === "active"
                    ? "text-green-800"
                    : "text-red-800";

                return (
                  <tr key={course._id} className="border-b last:border-none">
                    <td className="py-4 px-4">
                      <div className="font-semibold">{course?.name}</div>
                    </td>
                    <td className="py-4 px-4">{course?.level}</td>
                    <td className="py-4 px-4">
                      {course?.price?.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-xs font-semibold`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">

                      <button
                        className="text-gray-600 hover:text-blue-600"
                        title="View"
                      >
                        <div className="flex gap-3">
                          <Eye Size={20} />View Details
                        </div>

                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-600">
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
