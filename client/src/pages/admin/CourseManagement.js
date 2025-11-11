import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Eye, Trash2, X, Edit } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import AddCourseModal from "../../components/admin/AddCourseModal";
import ShowCourseDetailModal from "../../components/admin/ShowCourseDetailModal";
import UpdateCourseModal from "../../components/admin/UpdateCourseModal";

const levelColors = {
  beginner: "bg-gray-100 text-gray-800",
  intermediate: "bg-gray-200 text-gray-900",
  advanced: "bg-blue-600 text-white",
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:9999/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(data.data);
    } catch (e) {
      console.error("Fetch courses failed", e);
    }
  };

  const handleAddCourse = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:9999/api/courses/add",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        setCourses((prev) => [...prev, data.data]);
        setShowAddModal(false);
        setSelectedCourse(data.data);
      }
    } catch (e) {
      console.error("Add course failed", e);
    }
  };

  const handleDeleteCourse = async (_id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(
        `http://localhost:9999/api/courses/delete/${_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) setCourses((prev) => prev.filter((c) => c._id !== _id));
    } catch (e) {
      console.error("Delete course failed", e);
    }
  };

  const filtered = courses.filter((c) => {
    const s = search.toLowerCase();
    return (
      (c.name.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s)) &&
      (level === "all" || c.level === level) &&
      (status === "all" || c.status === status)
    );
  });

  const clearFilters = () => {
    setSearch("");
    setLevel("all");
    setStatus("all");
  };

  return (
    <AdminLayout>
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Courses</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </button>
        </div>

        {/* filters */}
        <div className="bg-white shadow rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  className="w-full border rounded pl-10 pr-3 py-2"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="all">All</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 border rounded"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* table */}
        <table className="min-w-full bg-white shadow-md border">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Level</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c._id} className="border-b last:border-none">
                <td className="py-4 px-4 font-semibold">{c.name}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      levelColors[c.level]
                    }`}
                  >
                    {c.level}
                  </span>
                </td>
                <td className="py-4 px-4">${c.price.toFixed(2)}</td>
                <td className="py-4 px-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                    {c.status}
                  </span>
                </td>
                <td
                  className="py-4 px-4 cursor-pointer"
                  onClick={() =>
                    setExpandedDescriptionId((p) =>
                      p === c._id ? null : c._id
                    )
                  }
                >
                  {expandedDescriptionId === c._id
                    ? c.description
                    : `${c.description.slice(0, 30)}${
                        c.description.length > 30 ? "..." : ""
                      }`}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-3">
                    <button
                      className="text-gray-600 hover:text-blue-600"
                      title="Edit"
                      onClick={() => {
                        setSelectedCourse(c);
                        setShowUpdateModal(true);
                      }}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-blue-600"
                      onClick={() => {
                        setSelectedCourse(c);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      disabled
                      className="text-gray-300 cursor-not-allowed"
                      onClick={(e) => e.preventDefault()}
                      title="Delete feature is disabled"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddCourseModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleAddCourse}
        />
      )}
      {showUpdateModal && selectedCourse && (
        <UpdateCourseModal
          course={selectedCourse}
          onClose={() => {
            setSelectedCourse(null);
            setShowUpdateModal(false);
          }}
          onUpdate={(updated) =>
            setCourses((prev) =>
              prev.map((c) => (c._id === updated._id ? updated : c))
            )
          }
        />
      )}
      {showDetailModal && selectedCourse && (
        <ShowCourseDetailModal
          course={selectedCourse}
          onClose={() => {
            setSelectedCourse(null);
            setShowDetailModal(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
