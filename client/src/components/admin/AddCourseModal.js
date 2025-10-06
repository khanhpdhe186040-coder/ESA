import { useState } from "react";
import axios from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AddCourseModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [level, setLevel] = useState("beginner");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Course name is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!image.trim()) newErrors.image = "Image URL is required.";
    if (price === "" || isNaN(price))
      newErrors.price = "Valid price is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const courseData = {
      name,
      description,
      image,
      price: parseFloat(price),
      status,
      level,
    };
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:9999/api/courses/add",
        courseData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        onCreate(data.data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create course", err);
    }
  };

  return (
    <AnimatePresence>
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogTitle className="text-xl font-bold mb-4">
              Add New Course
            </DialogTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Course Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Image URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                {errors.image && (
                  <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
