import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";

export default function AddUserModal({ onClose, onCreate }) {
  /* ---------------- State ---------------- */
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    number: "",
    birthday: "",
    address: "",
    roleId: "",
    status: "pending", // Default status
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  /* ---------------- Fetch roles ---------------- */
  useEffect(() => {
    axios
      .get("http://localhost:9999/api/roles")
      .then((res) => setRoles(res.data.data));
  }, []);

  const validate = () => {
    const newErrors = {};
    let valid = true;

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }

    if (!form.userName.trim()) {
      newErrors.userName = "Username is required";
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email)) {
      newErrors.email = "Valid email is required";
      valid = false;
    }

    if (!form.password || form.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
      valid = false;
    }

    if (!form.number.trim()) {
      newErrors.number = "Phone number is required";
      valid = false;
    }

    if (!form.birthday.trim()) {
      newErrors.birthday = "Birthday is required";
      valid = false;
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    if (!form.roleId) {
      newErrors.roleId = "Role is required";
      valid = false;
    }

    if (!form.status) {
      newErrors.status = "Status is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await axios.post(
        "http://localhost:9999/api/users/register",
        form,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (res.status === 201) {
        onCreate(res.data.data);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

return (
  <AnimatePresence>
    <motion.div
      // Thay đổi backdrop: Màu tối hơn, blur nhẹ
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        // Thay đổi Modal Box: rounded-3xl, shadow-2xl, max-w-2xl
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          // Style nút đóng hiện đại hơn
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Add New User
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Enter the details to create a new user account.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            "fullName",
            "userName",
            "email",
            "password",
            "number",
            "birthday",
          ].map((k) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700">
                {k
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
              </label>
              <input
                name={k}
                type={
                  k === "password"
                    ? "password"
                    : k === "birthday"
                    ? "date"
                    : "text"
                }
                // Input style mới: rounded-xl, focus blue, py-2.5
                className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                value={form[k]}
                onChange={handleChange}
              />
              {errors[k] && (
                <p className="text-red-500 text-sm mt-1">{errors[k]}</p>
              )}
            </div>
          ))}

          {/* address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              name="address"
              // Input style mới: rounded-xl, focus blue, py-2.5
              className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="roleId"
              // Select style mới: rounded-xl, focus blue, py-2.5
              className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition appearance-none"
              value={form.roleId}
              onChange={handleChange}
            >
              <option value="">-- Select Role --</option>
              {roles.map((r) => (
                <option key={r._id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>
            )}
          </div>

          {/* status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              // Select style mới: rounded-xl, focus blue, py-2.5
              className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition appearance-none"
              value={form.status}
              onChange={handleChange}
            >
              <option value="">-- Select Status --</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status}</p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            // Button Cancel mới: bo tròn, hover effect
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            // Button Create mới: gradient, shadow, bo tròn
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md transition font-semibold"
          >
            Create
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
}