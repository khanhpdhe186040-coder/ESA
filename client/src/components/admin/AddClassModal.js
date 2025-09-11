import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddClassModal({ onClose, onCreate }) {
  const [courses, setCourses] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);

  const [form, setForm] = useState({
    name: "",
    courseId: "",
    startDate: "",
    endDate: "",
    capacity: "",
    status: "ongoing",
    teachers: [],
    students: [],
    schedule: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [cRes, tRes, stuRes] = await Promise.all([
          axios.get("http://localhost:9999/api/courses", config),
          axios.get(
            "http://localhost:9999/api/users/by-role?roleId=r2",
            config
          ),
          axios.get(
            "http://localhost:9999/api/users/by-role?roleId=r3",
            config
          ),
        ]);
        setCourses(cRes.data.data);

        setTeachersList(tRes.data.data);
        setStudentsList(stuRes.data.data);
      } catch (e) {
        console.error("Dropdown fetch failed", e);
      }
    })();
  }, []);

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Class name required";
    if (!form.courseId) e.courseId = "Course required";
    if (!form.startDate) e.startDate = "Start date required";
    if (!form.endDate) e.endDate = "End date required";
    if (!form.capacity || isNaN(form.capacity) || form.capacity < 1)
      e.capacity = "Capacity must be > 0";
    if (form.teachers.length === 0) e.teachers = "At least 1 teacher required";
    if (form.students.length === 0) {
      e.students = "At least 1 student required";
    } else if (form.students.length > +form.capacity) {
      e.students = "Class is full or exceeds capacity";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMulti = (e) => {
    const { name, options } = e.target;
    const values = Array.from(options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    setField(name, values);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        capacity: Number(form.capacity),
        schedule: [
          {
            slot: "6873841e4b8c2980601b4e7c",
            room: "6878a52b1ee63a2c0fc2d8e7",
            weekday: "Monday",
          },
        ],
      };

      const { data } = await axios.post(
        "http://localhost:9999/api/classes/add",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onCreate();
      onClose();
    } catch (err) {
      console.error("Failed to create class", err);
    }
  };

  return (
    <AnimatePresence>
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="text-xl font-bold mb-4">
              Add New Class
            </DialogTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Class Name</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Course</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.courseId}
                  onChange={(e) => setField("courseId", e.target.value)}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.courseId && (
                  <p className="text-red-500 text-sm">{errors.courseId}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value)}
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm">{errors.capacity}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm">{errors.endDate}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium">Teachers</label>
                <select
                  name="teachers"
                  multiple
                  value={form.teachers}
                  onChange={handleMulti}
                  className="w-full border rounded px-3 py-2 h-32 mt-1"
                >
                  {teachersList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
                {errors.teachers && (
                  <p className="text-red-500 text-sm">{errors.teachers}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Students</label>
                <select
                  name="students"
                  multiple
                  value={form.students}
                  onChange={handleMulti}
                  className="w-full border rounded px-3 py-2 h-32 mt-1"
                >
                  {studentsList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
                {errors.students && (
                  <p className="text-red-500 text-sm">{errors.students}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 font-semibold"
              >
                Create
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </AnimatePresence>
  );
}
