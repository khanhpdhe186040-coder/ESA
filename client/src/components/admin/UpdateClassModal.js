import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, ChevronDown } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import MultiSelectDropdown from '../MultiSelectDropdown'; // Cần thêm import
import SingleSelectDropdown from '../SingleSelectDropdown'; // Cần thêm import

export default function UpdateClassModal({ classData, onClose, onUpdate }) {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachersList] = useState([]);
  const [students, setStudentsList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
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
  const [submitError, setSubmitError] = useState(null); // THÊM STATE LỖI

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // SỬA LỖI: Đảm bảo rRes và sRes được khai báo trong destructuring
        const [cRes, tRes, stuRes, rRes, sRes] = await Promise.all([
          axios.get("http://localhost:9999/api/courses", config),
          axios.get(
            "http://localhost:9999/api/users/by-role?roleId=r2",
            config
          ),
          axios.get(
            "http://localhost:9999/api/users/by-role?roleId=r3",
            config
          ),
          // API cho Rooms (CẦN ĐẢM BẢO ENDPOINT NÀY TỒN TẠI VÀ TRẢ VỀ {data: {data: [...]}})
          axios.get("http://localhost:9999/api/rooms", config),
          // API cho Slots (CẦN ĐẢM BẢO ENDPOINT NÀY TỒN TẠI VÀ TRẢ VỀ {data: {data: [...]}})
          axios.get("http://localhost:9999/api/slots", config),
        ]);

        setCourses(cRes.data.data);
        setTeachersList(tRes.data.data);
        setStudentsList(stuRes.data.data);
        // Lưu data vào state
        setRoomsList(rRes.data.data);
        setSlotsList(sRes.data.data);

      } catch (e) {
        console.error("Dropdown fetch failed", e);
        // THÊM LOG NÀY NẾU VẪN LỖI FETCH DATA
        alert("Lỗi khi fetch Rooms/Slots/Courses. Vui lòng kiểm tra API server.");
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
      // Đảm bảo schedule luôn là mảng, xử lý populating
      schedule: Array.isArray(classData.schedule) ? classData.schedule.map((s) => ({
        weekday: s.weekday,
        // Lấy _id nếu là object (populate) hoặc string (raw)
        slot: typeof s.slot === "object" && s.slot !== null ? s.slot._id : s.slot,
        room: s.room?._id || s.room || "",
      })) : [],

      teachers: Array.isArray(classData.teachers) ? classData.teachers.map((t) =>
        typeof t === "string" ? t : t._id
      ) : [],
      students: Array.isArray(classData.students) ? classData.students.map((s) =>
        typeof s === "string" ? s : s._id
      ) : [],
    });
  }, [classData]);

  const setField = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors(prevErrors => ({
      ...prevErrors,
      [k]: undefined,
    }));
  };
  // HÀM xử lý schedule (Tương tự AddClassModal)
  const handleScheduleChange = (index, name, value) => {
    const newSchedule = [...form.schedule];
    newSchedule[index] = { ...newSchedule[index], [name]: value };
    setField("schedule", newSchedule);
  };
  const addSchedule = () => {
    setField("schedule", [
      ...form.schedule,
      { slot: "", room: "", weekday: "" },
    ]);
  };
  const removeSchedule = (index) => {
    setField(
      "schedule",
      form.schedule.filter((_, i) => i !== index)
    );
  };
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
    
    // THÊM: Validate Schedule (Đã đồng bộ từ AddClassModal)
    if (form.schedule.length === 0) {
      e.schedule = "At least one schedule configuration is required";
    } else {
      const hasEmptyScheduleField = form.schedule.some(s => !s.weekday || !s.slot || !s.room);
      if (hasEmptyScheduleField) {
        e.schedule = "All fields (Day, Slot, Room) must be selected for every schedule entry";
      }
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMultiSelectChange = (name, newValues) => {
    // 'name' là tên trường (ví dụ: 'teachers' hoặc 'students')
    // 'newValues' là một mảng các ID đã được chọn
    setField(name, newValues);
  };

  const handleUpdate = async () => {
    setSubmitError(null); // RESET LỖI
    if (!validate()) return;
    
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        capacity: +form.capacity,
        // Dữ liệu schedule đã được chuẩn hóa trong form state
      };
      
      // XÓA HARDCODE SCHEDULE DƯỚI ĐÂY
      // const payload = { ...form, capacity: +form.capacity, schedule: [ { slot: "6873841e4b8c2980601b4e7c", room: "6878a52b1ee63a2c0fc2d8e7", weekday: "Monday", }, ], };
      
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
    } catch (err) {
      console.error("Update class failed", err);

      // BẮT LỖI TỪ BACKEND ĐÃ ĐƯỢC CẬP NHẬT
      if (err.response && err.response.status === 409 && err.response.data.type === 'schedule_conflict') {
        // Lỗi trùng lịch, set thông báo chi tiết
        setSubmitError(err.response.data.message);
      } else {
        // Lỗi chung (500, 400, v.v.)
        setSubmitError(err.response?.data?.message || "An unexpected error occurred during class update.");
      }
    }
  };

  return (
    <AnimatePresence>
      <Dialog open={true} onClose={onClose} className="relative z-50">
        {/* backdrop */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* center */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            // Style Modal đồng bộ với AddClassModal
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
              Update Class
            </DialogTitle>
            <p className="text-gray-500 mb-6 text-sm">
              Review and update the class information.
            </p>

            {/* main */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Class Name</label>
                <input
                  // Input Style đồng bộ
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                {/* SingleSelectDropdown for Course */}
                <SingleSelectDropdown
                    label="Course"
                    name="courseId"
                    options={courses.map(c => ({ _id: c._id, name: c.name }))}
                    selectedValue={form.courseId}
                    onChange={setField}
                    error={errors.courseId}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  // Input Style đồng bộ
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value)}
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  // Input Style đồng bộ
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  // Input Style đồng bộ
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
              
              <div>
                {/* SingleSelectDropdown for Status */}
                <SingleSelectDropdown
                    label="Status"
                    name="status"
                    options={[
                        { _id: "ongoing", name: "Ongoing" },
                        { _id: "finished", name: "Finished" },
                        { _id: "cancelled", name: "Cancelled" },
                    ]}
                    selectedValue={form.status}
                    onChange={setField}
                    error={errors.status}
                />
              </div>
            </div>
            
            {/* Schedule Configuration (Đã được đơn giản hóa trong code cũ, cần cập nhật nếu muốn đồng bộ) */}
            <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
                    Recurring Schedule
                    <button
                        type="button"
                        onClick={addSchedule}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
                    >
                        + Add Schedule
                    </button>
                </h3>

                {/* SỬ DỤNG LẠI PHẦN SCHEDULE CỦA ADD CLASS MODAL ĐỂ ĐỒNG BỘ UI */}
                {form.schedule.map((sch, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 mb-4 border border-gray-200 rounded-xl relative bg-gray-50">
                        {/* Weekday */}
                        <div>
                            <SingleSelectDropdown
                                label="Day"
                                name="weekday"
                                options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({ _id: day, name: day }))}
                                selectedValue={sch.weekday}
                                onChange={(n, v) => handleScheduleChange(index, n, v)}
                                isSmall={true}
                            />
                        </div>

                      
                    {/* Slot */}
                    <div>
                      {/* Thay thế <label> và <select> cũ */}
                      <SingleSelectDropdown
                          label="Time Slot"
                          name="slot"
                          options={slotsList.map((s) => ({ _id: s._id, name: `${s.from} - ${s.to}` }))}
                          selectedValue={sch.slot}
                          onChange={(n, v) => handleScheduleChange(index, n, v)}
                          isSmall={true}
                      />
                    </div>


                        {/* Room */}
                        <div>
                            <SingleSelectDropdown
                                label="Room"
                                name="room"
                                options={roomsList.map((r) => ({ _id: r._id, name: `${r.name} (${r.location})` }))}
                                selectedValue={sch.room}
                                onChange={(n, v) => handleScheduleChange(index, n, v)}
                                isSmall={true}
                            />
                        </div>
                        {/* Remove Button */}
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => removeSchedule(index)}
                                className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition text-sm font-medium"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                {errors.schedule && (
                    <p className="text-red-500 text-sm mt-1">{errors.schedule}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Teachers Dropdown - Dùng MultiSelectDropdown */}
              <MultiSelectDropdown
                label="Teachers"
                name="teachers"
                options={teachers.map(t => ({ _id: t._id, name: t.fullName }))}
                selectedValues={form.teachers}
                onChange={handleMultiSelectChange}
                error={errors.teachers}
              />
              {/* Students Dropdown - Dùng MultiSelectDropdown */}
              <MultiSelectDropdown
                label="Students"
                name="students"
                options={students.map(s => ({ _id: s._id, name: s.fullName }))}
                selectedValues={form.students}
                onChange={handleMultiSelectChange}
                error={errors.students}
              />
            </div>

            {/* PHẦN HIỂN THỊ LỖI ĐÃ ĐƯỢC THÊM VÀO */}
            {submitError && (
              <div className="mt-6 p-2 text-red-700 rounded-xl flex items-start space-x-3 transition-opacity duration-300">
                {/* Icon cảnh báo (màu đỏ) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div className="flex-grow">
                  {/* Giữ tiêu đề đậm và màu chữ lỗi */}
                  <p className="font-bold text-base mb-0.5 text-red-800">Update Failed</p>
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            )}


            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                // Button Cancel đồng bộ
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                // Button Save đồng bộ
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md transition font-semibold"
              >
                Save Changes
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </AnimatePresence>
  );
}