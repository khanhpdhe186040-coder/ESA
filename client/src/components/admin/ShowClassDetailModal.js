import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function ShowClassDetailModal({ classData, onClose }) {
  if (!classData) return null;

  const fmt = (d) => new Date(d).toLocaleDateString();

  const capacityDisplay = `${classData.students.length}/${classData.capacity}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>

          <h2 className="text-2xl font-semibold mb-6 text-center">
            Class Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Detail label="Class Name" value={classData.name} />
            <Detail label="Course" value={classData.courseId?.name || "-"} />
            <Detail label="Start Date" value={fmt(classData.startDate)} />
            <Detail label="End Date" value={fmt(classData.endDate)} />
            <Detail label="Capacity" value={capacityDisplay} />
            <Detail label="Status" value={classData.status} />
          </div>

          {/* Schedule */}
          <Section title="Schedule">
            {classData.schedule.length === 0 ? (
              <p>-</p>
            ) : (
              <ul className="list-disc ml-6 space-y-1">
                {classData.schedule.map((s, i) => {
                  const from = s.slot?.from || s.slot?.timeStart || "";
                  const to = s.slot?.to || s.slot?.timeEnd || "";
                  return (
                    <li key={i}>
                      {s.weekday}: {from && to ? `${from} – ${to}` : "-"}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Teachers">
            {classData.teachers.length === 0 ? (
              <p>-</p>
            ) : (
              <ul className="list-disc ml-6 space-y-1">
                {classData.teachers.map((t) => (
                  <li key={typeof t === "string" ? t : t._id}>
                    {typeof t === "string" ? t : t.fullName}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Students">
            {classData.students.length === 0 ? (
              <p>-</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {classData.students.map((s, idx) => (
                  <p
                    key={typeof s === "string" ? s : s._id}
                    className="list-item list-disc ml-6"
                  >
                    {typeof s === "string" ? s : s.fullName}
                  </p>
                ))}
              </div>
            )}
          </Section>

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

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-800 mt-1 break-words">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <h3 className="font-medium text-gray-700 mb-1">{title}</h3>
      {children}
    </div>
  );
}
