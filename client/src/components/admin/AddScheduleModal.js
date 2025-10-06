import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";

export default function AddScheduleModal({
  isOpen,
  onClose,
  classId,
  onCreated,
}) {
  const [slots, setSlots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ slotId: "", roomId: "", date: "" });
  const [alert, setAlert] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [slotsRes, roomsRes] = await Promise.all([
          axios.get("http://localhost:9999/api/slots"),
          axios.get("http://localhost:9999/api/rooms"),
        ]);
        setSlots(slotsRes.data.data || []);
        setRooms(roomsRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch slots or rooms:", err);
      }
    };

    fetchData();
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = async () => {
    if (!form.slotId || !form.roomId || !form.date) {
      setAlert("Please fill all fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:9999/api/schedule/add",
        {
          classId,
          slotId: form.slotId,
          roomId: form.roomId,
          date: new Date(form.date),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setAlert("Schedule created successfully");
        onCreated?.();
        setTimeout(() => {
          setAlert("");
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      setAlert("Error creating schedule");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setForm({ slotId: "", roomId: "", date: "" });
      setAlert("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md"
            >
              <DialogPanel>
                <DialogTitle className="text-lg font-medium text-gray-900 mb-4">
                  Add Schedule
                </DialogTitle>

                {alert && (
                  <div className="mb-3 text-sm text-green-600 font-semibold">
                    {alert}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Slot</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                      value={form.slotId}
                      onChange={(e) => handleChange("slotId", e.target.value)}
                    >
                      <option value="">-- Select Slot --</option>
                      {slots.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.from} - {s.to}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Room</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                      value={form.roomId}
                      onChange={(e) => handleChange("roomId", e.target.value)}
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                      value={form.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
