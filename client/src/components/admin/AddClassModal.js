import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MultiSelectDropdown from '../MultiSelectDropdown'; // Adjust path as needed
import SingleSelectDropdown from '../SingleSelectDropdown';
export default function AddClassModal({ onClose, onCreate }) {
  const [courses, setCourses] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [form, setForm] = useState({
    name: "",
    courseId: "",
    startDate: "",
    endDate: "",
    capacity: "",
    status: "ongoing",
    teachers: [],
    students: [],
    // Khởi tạo schedule là mảng rỗng cho cấu hình lặp lại
    schedule: [],
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
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
  const setField = (fieldName, value) => {
    setForm(prevForm => ({
      ...prevForm,
      [fieldName]: value
    }));
    // Thường thì bạn cũng sẽ xóa lỗi cho trường đó khi dữ liệu thay đổi
    setErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: undefined,
    }));
  };

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
    if (form.teachers.length === 0) e.teachers = "At least 1 teacher required";
    if (form.students.length === 0) {
      e.students = "At least 1 student required";
    } else if (form.students.length > +form.capacity) {
      e.students = "Class is full or exceeds capacity";
    }
    // THÊM: Validate Schedule
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


  // HÀM CHÍNH ĐỂ XỬ LÝ MULTI-SELECT
  const handleMultiSelectChange = (name, newValues) => {
    // 'name' là tên trường (ví dụ: 'teachers' hoặc 'students')
    // 'newValues' là một mảng các ID đã được chọn (ví dụ: ['id_t1', 'id_t3'])

    setField(name, newValues);
  };
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;

    try {
      // const token = localStorage.getItem("token");

      // const payload = {
      //   ...form,
      //   capacity: Number(form.capacity),
      // };

      // const { data } = await axios.post(
      //   "http://localhost:9999/api/classes/add",
      //   payload,
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   }
      // );

      onCreate();
      onClose();
    } catch (err) {
      console.error("Failed to create class", err);

      // BẮT LỖI TỪ BACKEND
      if (err.response && err.response.status === 409 && err.response.data.type === 'schedule_conflict') {
        // Lỗi trùng lịch, set thông báo chi tiết
        setSubmitError(err.response.data.message);
      } else {
        // Lỗi chung (500, 400, v.v.)
        setSubmitError(err.response?.data?.message || "An unexpected error occurred during class creation.");
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
              Add New Class
            </DialogTitle>
            <p className="text-gray-500 mb-6 text-sm">
              Fill in the information below to create a new class.
            </p>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Class Name</label>
                <input
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Enter class name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                {/* Thay thế <label> và <select> cũ */}
                <SingleSelectDropdown
                    label="Course"
                    name="courseId"
                    options={courses.map(c => ({ _id: c._id, name: c.name }))}
                    selectedValue={form.courseId}
                    onChange={setField} // setField(name, value) hoạt động tốt ở đây
                    error={errors.courseId}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.capacity}
                  onChange={(e) => setField("capacity", e.target.value)}
                  placeholder="Enter capacity"
                />
                {errors.capacity && (
                  <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
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
                  className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 mt-1 transition"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Schedule Configuration */}
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

              {form.schedule.map((sch, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 mb-4 border border-gray-200 rounded-xl relative bg-gray-50">

                  {/* Weekday */}
                  <div>
                    {/* Thay thế <label> và <select> cũ */}
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
                    {/* Thay thế <label> và <select> cũ */}
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
            {/* End Schedule Configuration */}
            {/* Multi select - UPDATED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

              {/* Teachers Dropdown */}
              <MultiSelectDropdown
                label="Teachers"
                name="teachers"
                // Map dữ liệu để phù hợp với format [{_id: 'id', name: 'fullName'}] mà MultiSelectDropdown mong đợi
                options={teachersList.map(t => ({ _id: t._id, name: t.fullName }))}
                selectedValues={form.teachers}
                onChange={handleMultiSelectChange} // <-- Dùng hàm xử lý mới
                error={errors.teachers}
              />

              {/* Students Dropdown */}
              <MultiSelectDropdown
                label="Students"
                name="students"
                options={studentsList.map(s => ({ _id: s._id, name: s.fullName }))}
                selectedValues={form.students}
                onChange={handleMultiSelectChange} // <-- Dùng hàm xử lý mới
                error={errors.students}
              />
            </div>
            {/* ERROR DISPLAY MỚI - KHÔNG VIỀN, KHÔNG NỀN */}
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
                  <p className="font-bold text-base mb-0.5 text-red-800">Creation Failed</p>
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              </div>
            )}
            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md transition font-semibold"
              >
                Create Class
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </AnimatePresence>


  );
}
