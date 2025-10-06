import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";

export default function UpdateUserModal({ onClose, user, onUpdate }) {
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
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  /* ---------------- Load roles ---------------- */
  useEffect(() => {
    axios
      .get("http://localhost:9999/api/roles")
      .then((res) => setRoles(res.data.data));
  }, []);

  /* ---------------- Sync user → form ---------------- */
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        userName: user.userName || "",
        email: user.email || "",
        password: "",
        number: user.number || "",
        birthday: user.birthday ? user.birthday.slice(0, 10) : "",
        address: user.address || "",
        roleId: typeof user.roleId === "object" ? user.roleId.id : user.roleId,
      });
    }
  }, [user]);

  /* ---------------- Validate ---------------- */
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

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ---------------- Submit ---------------- */
  const handleUpdate = async () => {
    if (!validate()) return;
    const payload = { ...form };
    if (!payload.password) delete payload.password; // giữ mật khẩu cũ
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:9999/api/users/${user._id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        onUpdate(res.data.data);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  /* ---------------- JSX ---------------- */
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
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
            Update User
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "fullName",
              "userName",
              "email",
              "password",
              "number",
              "birthday",
            ].map((k) => (
              <div key={k}>
                <label className="block font-medium">
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
                  className="w-full px-3 py-2 mt-1 border rounded"
                  value={form[k]}
                  onChange={handleChange}
                />
                {errors[k] && (
                  <p className="text-red-600 text-sm mt-1">{errors[k]}</p>
                )}
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block font-medium">Address</label>
              <input
                name="address"
                className="w-full px-3 py-2 mt-1 border rounded"
                value={form.address}
                onChange={handleChange}
              />
              {errors.address && (
                <p className="text-red-600 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-center">
              <div className="w-full md:w-1/2">
                <label className="block font-medium">Role</label>
                <select
                  name="roleId"
                  className="w-full px-3 py-2 mt-1 border rounded"
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
                  <p className="text-red-600 text-sm mt-1">{errors.roleId}</p>
                )}
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-blue-700 text-white rounded"
            >
              Update
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
