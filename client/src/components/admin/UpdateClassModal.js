import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdateClassModal({ classData, onClose, onUpdate }) {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    name: "",
    courseId: "",
    startDate: "",
    endDate: "",
    capacity: 0,
    status: "ongoing",
    schedule: [],
    teachers: [],
    students: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const cRes = await axios.get(
          "http://localhost:9999/api/courses",
          config
        );
        setCourses(cRes?.data?.data || []);

        const tRes = await axios.get(
          "http://localhost:9999/api/users/by-role?roleId=r2",
          config
        );
        setTeachers(tRes?.data?.data || []);

        const stuRes = await axios.get(
          "http://localhost:9999/api/users/by-role?roleId=r3",
          config
        );
        setStudents(stuRes?.data?.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classData) return;
    setForm({
      name: classData.name || "",
      courseId: classData.courseId?._id || classData.courseId || "",
      startDate: classData.startDate ? classData.startDate.slice(0, 10) : "",
      endDate: classData.endDate ? classData.endDate.slice(0, 10) : "",
      capacity: classData.capacity,
      status: classData.status,
      schedule: classData.schedule.map((s) => ({
        weekday: s.weekday,
        slot:
          typeof s.slot === "object" && s.slot !== null ? s.slot._id : s.slot,
        room: s.room?._id || s.room || "",
      })),

      teachers: classData.teachers.map((t) =>
        typeof t === "string" ? t : t._id
      ),
      students: classData.students.map((s) =>
        typeof s === "string" ? s : s._id
      ),
    });
  }, [classData]);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Class name required";
    if (!form.courseId) e.courseId = "Course required";
    if (!form.startDate) e.startDate = "Start date required";
    if (!form.endDate) e.endDate = "End date required";
    if (!form.capacity || isNaN(form.capacity) || form.capacity < 1)
      e.capacity = "Capacity must be > 0";

    if (form.students.length === 0) {
      e.students = "At least 1 student required";
    } else if (form.students.length > +form.capacity) {
      e.students = "Over capacity!";
    }

    if (form.teachers.length === 0) {
      e.teachers = "At least 1 teacher required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMulti = (e) => {
    const { name, options } = e.target;
    const arr = Array.from(options)
      .filter((o) => o.selected)
      .map((o) => o.value);
    setField(name, arr);
  };
  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        capacity: +form.capacity,
        schedule: [
          {
            slot: "6873841e4b8c2980601b4e7c",
            room: "6878a52b1ee63a2c0fc2d8e7",
            weekday: "Monday",
          },
        ],
      };
      const { data } = await axios.put(
        `http://localhost:9999/api/classes/update/${classData._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (e) {
      console.error("Update class failed", e);
    }
  };

  return (
    <AnimatePresence>
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="bg-white w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="text-xl font-bold mb-4">
              Update Class
            </DialogTitle>

            {/* main */}
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
                  <option value="">-- Select --</option>
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
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
                {errors.teachers && (
                  <p className="text-red-500 text-sm mt-1">{errors.teachers}</p>
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
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
                {errors.students && (
                  <p className="text-red-500 text-sm mt-1">{errors.students}</p>
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
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 font-semibold"
              >
                Save
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </AnimatePresence>
  );
}
