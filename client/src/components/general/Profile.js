import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import axios from "axios";
import { X, ImagePlus, Trash2, Loader2, AlertTriangle } from "lucide-react";

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
  const hydratedOnceRef = useRef(false);
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
    email:    u?.email    ?? form.email,
    number:   u?.number   ?? form.number,
    birthday: toInputDate(u?.birthday) || form.birthday,
    address:  u?.address  ?? form.address,
    image:    u?.image ?? u?.imageUrl ?? u?.avatarUrl ?? u?.avatar ?? form.image,
    roleId:
      typeof u?.roleId === "object"
        ? u?.roleId?.id ?? u?.roleId?._id ?? form.roleId
        : u?.roleId ?? form.roleId,
  });

  // Age calculation
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
    const startsDigit = /^\d/.test(trimmed);
    const endsDigit = /\d$/.test(trimmed);
    const digitsOnly = trimmed.replace(/\D/g, "");
    const lengthOK = digitsOnly.length === 10;
    return {
      ok: startsDigit && endsDigit && lengthOK,
      reason: !lengthOK
        ? "Phone number must have exactly 10 digits"
        : !startsDigit || !endsDigit
        ? "Phone number must start and end with a number"
        : "",
    };
  };

  useEffect(() => {
    if (!initialUser) return;

    const incomingId = initialUser?._id || initialUser?.id;
    const currentId  = id ? String(id) : null;

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
          alert("Unauthorized. Please log in again.");
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
        alert(err?.response?.data?.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [initialUser, token, id]);

  /* ---------------- Validation ---------------- */
  const validate = () => {
    const newErrors = {};
    let valid = true;

    if (!form.fullName.trim()) {
  newErrors.fullName = "Full name is required";
  valid = false;
} if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(form.fullName.trim())) {
  newErrors.fullName = "Full name can only contain letters, spaces, hyphens, or apostrophes";
  valid = false;
}
    if (!form.userName.trim()) { newErrors.userName = "Username is required"; valid = false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email)) {
      newErrors.email = "Valid email is required"; valid = false;
    }
    const phoneCheck = validatePhone(form.number);
    if (!phoneCheck.ok) { newErrors.number = phoneCheck.reason; valid = false; }
    if (!form.birthday.trim()) {
      newErrors.birthday = "Birthday is required";
      valid = false;
    } else {
      const age = calcAge(form.birthday);
      if (age == null) {
        newErrors.birthday = "Birthday is invalid";
        valid = false;
      } else {
        const role = form.roleId;
        if (role === "r3") {
          if (age < 6 || age > 100) {
            newErrors.birthday = "Age must be between 6 and 100 years old";
            valid = false;
          }
        } else if (role === "r1" || role === "r2") {
          if (age < 22 || age > 70) {
            newErrors.birthday = "Age must be between 22 and 70 years old";
            valid = false;
          }
        } else {
          if (age < 6 || age > 100) {
            newErrors.birthday = "Age must be between 6 and 100 years old";
            valid = false;
          }
        }
      }
    }

    // Password (optional)
    if (passwords.password || passwords.confirmPassword) {
      if (passwords.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters"; valid = false;
      }
      if (passwords.password !== passwords.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"; valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  /* ---------------- Handlers ---------------- */
  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const handlePwChange = (e) =>
    setPasswords((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
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

  /* ---------------- Save ---------------- */
  const handleSave = async () => {
    if (!validate()) return;
    const idForPut = initialUser?._id || id;
    if (!token || !idForPut) {
      alert("Authentication or user ID missing.");
      return;
    }

    setSaving(true);
    try {
      let putRes;

      if (imageFile) {
        const fd = new FormData();
        fd.append("fullName", form.fullName ?? "");
        fd.append("userName", form.userName ?? "");
        fd.append("email",    form.email ?? "");
        fd.append("number",   form.number ?? "");
        fd.append("birthday", form.birthday ?? "");
        fd.append("address",  form.address ?? "");
        fd.append("roleId",   form.roleId ?? "");
        fd.append("image", imageFile);
        if (passwords.password) fd.append("password", passwords.password);

        putRes = await axios.put(
          `http://localhost:9999/api/users/${idForPut}`,
          fd,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true,
          }
        );
      } else {
        const payload = {
          fullName: form.fullName ?? "",
          userName: form.userName ?? "",
          email:    form.email ?? "",
          number:   form.number ?? "",
          birthday: form.birthday ?? "",
          address:  form.address ?? "",
          image:    form.image ?? "",
          roleId:   form.roleId ?? "",
          ...(passwords.password ? { password: passwords.password } : {}),
        };

        putRes = await axios.put(
          `http://localhost:9999/api/users/${idForPut}`,
          payload,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            validateStatus: () => true,
          }
        );
      }

      if (putRes.status >= 400) {
        throw new Error(putRes.data?.message || `Update failed (${putRes.status})`);
      }

      const updatedUser = putRes?.data?.data ?? putRes?.data ?? null;
      if (updatedUser) {
        const nextForm = fromServerToForm(updatedUser);
        if (nextForm.image && form.image && nextForm.image === form.image && imageFile) {
          nextForm.image = `${nextForm.image}${nextForm.image.includes("?") ? "&" : "?"}t=${Date.now()}`;
        }
        setForm(nextForm);
        onUpdated?.(updatedUser);
      }

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setImageFile(null);

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("[Profile] Update failed:", err);
      alert(err?.message || err?.response?.data?.message || "Failed to update profile");
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

          {/* Buttons row */}
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

          {/* Optional password change */}
          <div>
            <label className="block font-medium">New Password (optional)</label>
            <input
              name="password"
              type="password"
              className="w-full px-3 py-2 mt-1 border rounded"
              value={passwords.password ?? ""}
              onChange={handlePwChange}
              placeholder="Leave empty to keep current password"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block font-medium">Confirm New Password</label>
            <input
              name="confirmPassword"
              type="password"
              className="w-full px-3 py-2 mt-1 border rounded"
              value={passwords.confirmPassword ?? ""}
              onChange={handlePwChange}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
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
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}