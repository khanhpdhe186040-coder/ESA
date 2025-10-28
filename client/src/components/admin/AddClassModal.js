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
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
  
      {/* center */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          as={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
  
          <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
            Add New Class
          </DialogTitle>
          <p className="text-gray-500 mb-6 text-sm">
            Fill in the information below to create a new class.
          </p>
  
          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Class Name</label>
              <input
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Enter class name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
  
            <div>
              <label className="text-sm font-medium text-gray-700">Course</label>
              <select
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form.courseId}
                onChange={(e) => setField("courseId", e.target.value)}
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.courseId && (
                <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>
              )}
            </div>
  
            <div>
              <label className="text-sm font-medium text-gray-700">Capacity</label>
              <input
                type="number"
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form.capacity}
                onChange={(e) => setField("capacity", e.target.value)}
                placeholder="Enter capacity"
              />
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>
  
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
  
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>
  
          {/* Multi select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Teachers</label>
              <select
                name="teachers"
                multiple
                value={form.teachers}
                onChange={handleMulti}
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 h-40 mt-1 transition"
              >
                {teachersList.map((t) => (
                  <option key={t._id} value={t._id}>{t.fullName}</option>
                ))}
              </select>
              {errors.teachers && (
                <p className="text-red-500 text-sm mt-1">{errors.teachers}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Students</label>
              <select
                name="students"
                multiple
                value={form.students}
                onChange={handleMulti}
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 h-40 mt-1 transition"
              >
                {studentsList.map((s) => (
                  <option key={s._id} value={s._id}>{s.fullName}</option>
                ))}
              </select>
              {errors.students && (
                <p className="text-red-500 text-sm mt-1">{errors.students}</p>
              )}
            </div>
          </div>
  
          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md transition font-semibold"
            >
              Create Class
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </AnimatePresence>
  

  );
}
