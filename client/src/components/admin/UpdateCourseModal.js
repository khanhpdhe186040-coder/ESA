import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";

export default function UpdateCourseModal({ onClose, course, onUpdate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
    level: "beginner",
    status: "active",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name || "",
        description: course.description || "",
        image: course.image || "",
        price: course.price || "",
        level: course.level || "beginner",
        status: course.status || "active",
      });
    }
  }, [course]);

  const validate = () => {
    const newErrors = {};
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Course name is required";
      valid = false;
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
      valid = false;
    }
    if (!form.image.trim()) {
      newErrors.image = "Image URL is required";
      valid = false;
    }
    if (form.price === "" || isNaN(form.price)) {
      newErrors.price = "Valid price is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:9999/api/courses/update/${course._id}`,
        { ...form },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200 && res.data.success) {
        onUpdate(res.data.data);
        onClose();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update course");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Update Course
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["name", "price"].map((key) => (
              <div key={key}>
                <label className="block font-medium capitalize">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                <input
                  name={key}
                  type={key === "price" ? "number" : "text"}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                  value={form[key]}
                  onChange={handleChange}
                />
                {errors[key] && (
                  <p className="text-red-600 text-sm mt-1">{errors[key]}</p>
                )}
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block font-medium">Description</label>
              <textarea
                name="description"
                rows="3"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                value={form.description}
                onChange={handleChange}
              ></textarea>
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium">Image URL</label>
              <input
                name="image"
                type="text"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                value={form.image}
                onChange={handleChange}
              />
              {errors.image && (
                <p className="text-red-600 text-sm mt-1">{errors.image}</p>
              )}
            </div>

            <div>
              <label className="block font-medium">Level</label>
              <select
                name="level"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                value={form.level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">Status</label>
              <select
                name="status"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 font-semibold"
            >
              Update
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
