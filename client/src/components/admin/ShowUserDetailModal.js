import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ShowUserDetailModal({ user, onClose }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  if (!userData) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative"
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
            User Detail
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Full Name", value: userData.fullName },
              { label: "Username", value: userData.userName },
              { label: "Email", value: userData.email },
              { label: "Phone Number", value: userData.number },
              {
                label: "Status",
                value: (
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm capitalize ${
                      userData.status === "active"
                        ? "bg-green-100 text-green-800"
                        : userData.status === "inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {userData.status || "-"}
                  </span>
                ),
              },
              { label: "Birthday", value: userData.birthday?.slice(0, 10) },
              { label: "Address", value: userData.address },
              {
                label: "Role",
                value: userData.roleId?.name || userData.roleId,
              },
              {
                label: "Created At",
                value: new Date(userData.createdAt).toLocaleDateString(),
              },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-sm font-medium text-gray-500">
                  {field.label}
                </p>
                <p className="text-base text-gray-800 mt-1 break-words">
                  {field.value || "-"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}