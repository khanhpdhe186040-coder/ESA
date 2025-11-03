import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import axios from "axios";
import { X, ImagePlus, Trash2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function Profile({ id: idProp, initialUser, onUpdated }) {
  /* ---------------- Token & ID derivation ---------------- */
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { id: idFromRoute } = useParams();

  const idFromToken = useMemo(() => {
    if (!token) return null;
    try {
      const p = jwtDecode(token);
      return p?.sub || p?._id || p?.id || p?.userId || null;
    } catch {
      return null;
    }
  }, [token]);

  const id = useMemo(() => {
    if (idProp) return idProp;
    if (idFromToken) return idFromToken;
    if (idFromRoute) return idFromRoute;
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("userId") ||
        localStorage.getItem("_id") ||
        localStorage.getItem("id")
      );
    }
    return null;
  }, [idProp, idFromToken, idFromRoute]);

  /* ---------------- State ---------------- */
  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    email: "",
    number: "",
    birthday: "",
    address: "",
    image: "",
    roleId: "",
  });
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const hydratedOnceRef = useRef(false);

  // Thông báo
  const [message, setMessage] = useState({ type: "", text: "" });
  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const toInputDate = (v) => {
    if (!v) return "";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "";
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    } catch {
      return "";
    }
  };

  const safeReadUser = (res) => res?.data?.data ?? res?.data?.user ?? res?.data ?? null;

  const hydrateFromUser = (u) => {
    setForm({
      fullName: u?.fullName ?? "",
      userName: u?.userName ?? "",
      email: u?.email ?? "",
      number: u?.number ?? "",
      birthday: toInputDate(u?.birthday),
      address: u?.address ?? "",
      image: u?.image ?? u?.imageUrl ?? u?.avatarUrl ?? u?.avatar ?? "",
      roleId:
        typeof u?.roleId === "object"
          ? u?.roleId?.id ?? u?.roleId?._id ?? ""
          : u?.roleId ?? "",
    });
  };

  const fromServerToForm = (u) => ({
    fullName: u?.fullName ?? form.fullName,
    userName: u?.userName ?? form.userName,
    email: u?.email ?? form.email,
    number: u?.number ?? form.number,
    birthday: toInputDate(u?.birthday) || form.birthday,
    address: u?.address ?? form.address,
    image: u?.image ?? u?.imageUrl ?? u?.avatarUrl ?? u?.avatar ?? form.image,
    roleId:
      typeof u?.roleId === "object"
        ? u?.roleId?.id ?? u?.roleId?._id ?? form.roleId
        : u?.roleId ?? form.roleId,
  });

  const calcAge = (isoDateStr) => {
    if (!isoDateStr) return null;
    const d = new Date(isoDateStr);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  };

  const validatePhone = (raw) => {
    if (!raw) return { ok: false, reason: "Phone number is required" };
    const trimmed = raw.trim();
    const digitsOnly = trimmed.replace(/\D/g, "");
    const lengthOK = digitsOnly.length === 10;
    return {
      ok: lengthOK,
      reason: !lengthOK ? "Phone number must have exactly 10 digits" : "",
    };
  };

  useEffect(() => {
    if (!initialUser) return;
    const incomingId = initialUser?._id || initialUser?.id;
    const currentId = id ? String(id) : null;
    const shouldHydrate =
      !hydratedOnceRef.current ||
      (incomingId && currentId && String(incomingId) !== currentId);
    if (!shouldHydrate) return;

    hydrateFromUser(initialUser);
    setNotFound(false);
    setLoading(false);
    hydratedOnceRef.current = true;
  }, [initialUser, id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (initialUser) return;
        if (!token || !id) {
          setNotFound(true);
          return;
        }
        const res = await axios.get(`http://localhost:9999/api/users/${id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setNotFound(true);
          setMessage({ type: "error", text: "Unauthorized. Please log in again." });
          return;
        }

        const u = safeReadUser(res);
        if (!u || Object.keys(u || {}).length === 0) {
          setNotFound(true);
          return;
        }
        hydrateFromUser(u);
        setNotFound(false);
        hydratedOnceRef.current = true;
      } catch (err) {
        console.error("[Profile] Fetch failed:", err);
        setNotFound(true);
        setMessage({ type: "error", text: "Failed to load profile" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [initialUser, token, id]);

  /* ---------------- Validation ---------------- */
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
    const phoneCheck = validatePhone(form.number);
    if (!phoneCheck.ok) {
      newErrors.number = phoneCheck.reason;
      valid = false;
    }
    if (!form.birthday.trim()) {
      newErrors.birthday = "Birthday is required";
      valid = false;
    } else {
      const age = calcAge(form.birthday);
      if (age == null) {
        newErrors.birthday = "Birthday is invalid";
        valid = false;
      }
    }
    if (passwords.password || passwords.confirmPassword) {
      if (passwords.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        valid = false;
      }
      if (passwords.password !== passwords.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const handlePwChange = (e) =>
    setPasswords((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const removeImageSelection = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
  };

  const handleSave = async () => {
    if (!validate()) return;
    const idForPut = initialUser?._id || id;
    if (!token || !idForPut) {
      setMessage({ type: "error", text: "Authentication or user ID missing." });
      return;
    }

    setSaving(true);
    try {
      let putRes;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
        fd.append("image", imageFile);
        if (passwords.password) fd.append("password", passwords.password);

        putRes = await axios.put(`http://localhost:9999/api/users/${idForPut}`, fd, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
      } else {
        const payload = {
          ...form,
          ...(passwords.password ? { password: passwords.password } : {}),
        };
        putRes = await axios.put(`http://localhost:9999/api/users/${idForPut}`, payload, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          validateStatus: () => true,
        });
      }

      if (putRes.status >= 400) {
        throw new Error(putRes.data?.message || `Update failed (${putRes.status})`);
      }

      const updatedUser = putRes?.data?.data ?? putRes?.data ?? null;
      if (updatedUser) {
        setForm(fromServerToForm(updatedUser));
        onUpdated?.(updatedUser);
      }

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setImageFile(null);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error("[Profile] Update failed:", err);
      setMessage({
        type: "error",
        text: err?.message || err?.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <Loader2 className="animate-spin mr-2" /> Loading profile...
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto p-4 md:p-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Thông báo */}
      {message.text && (
        <div
          className={`mb-4 flex items-center gap-2 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-300"
              : "bg-red-50 text-red-700 border border-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {notFound && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-semibold">No user data found.</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Image */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative h-40 w-40 rounded-full overflow-hidden border">
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
            ) : form.image ? (
              <img src={form.image} alt="profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                No image
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
              <ImagePlus className="w-4 h-4" />
              <span>Choose Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>

            {imagePreview && (
              <button
                type="button"
                onClick={removeImageSelection}
                className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["fullName", "userName", "email", "number", "birthday", "address"].map((k) => (
            <div key={k} className={k === "address" ? "md:col-span-2" : ""}>
              <label className="block font-medium">
                {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </label>
              <input
                name={k}
                type={k === "birthday" ? "date" : k === "email" ? "email" : "text"}
                className="w-full px-3 py-2 mt-1 border rounded"
                value={form[k] ?? ""}
                onChange={handleChange}
              />
              {errors[k] && <p className="text-red-600 text-sm mt-1">{errors[k]}</p>}
            </div>
          ))}

          {/* Change Password */}
          <div className="md:col-span-2 mt-4">
            {!showPasswordFields ? (
              <button
                type="button"
                onClick={() => setShowPasswordFields(true)}
                className="text-blue-700 hover:underline font-medium"
              >
                Change Password?
              </button>
            ) : (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Change Password</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setPasswords({ password: "", confirmPassword: "" });
                      setErrors((e) => ({ ...e, password: "", confirmPassword: "" }));
                    }}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium">New Password</label>
                    <input
                      name="password"
                      type="password"
                      className="w-full px-3 py-2 mt-1 border rounded"
                      value={passwords.password ?? ""}
                      onChange={handlePwChange}
                      placeholder="Enter new password"
                    />
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-medium">Confirm New Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      className="w-full px-3 py-2 mt-1 border rounded"
                      value={passwords.confirmPassword ?? ""}
                      onChange={handlePwChange}
                      placeholder="Confirm new password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-700 text-white rounded inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
