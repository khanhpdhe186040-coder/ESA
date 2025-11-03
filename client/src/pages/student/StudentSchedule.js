import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; 

// 🌟 ĐƯỜNG DẪN API CHÍNH XÁC: /api/student/:studentId/schedule
const API_BASE_URL = "http://localhost:9999/api/student"; 
const API_SCHEDULE_PATH = "/schedule"; // Thêm path này để dễ cấu hình

export default function StudentSchedule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  // Slot labels dựa trên thời gian bắt đầu (tương thích với Backend)
  const slotLabels = [
    "08:00", 
    "09:40", 
    "13:00", 
    "14:40", 
    "18:00", 
    "19:40", 
  ];

  // Logic mã hóa màu sắc điểm danh
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-700 border-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-500 border-gray-400'; // Chưa điểm danh
    }
  };

  const generateWeeksOfYear = (targetYear) => {
    const startDate = new Date(`${targetYear}-01-01`);
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < 53; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (weekStart.getFullYear() > targetYear && i > 0) break;

      const label = `${weekStart.toLocaleDateString(
        "en-GB"
      )} To ${weekEnd.toLocaleDateString("en-GB")}`;
      weeks.push({
        label,
        start: new Date(weekStart),
        end: new Date(weekEnd),
      });
    }
    return weeks;
  };

  const formatDate = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0]; // Trả về YYYY-MM-DD
  };

  const getDateByOffset = (startDate, offset) => {
    if (!startDate) return null;
    const date = new Date(startDate);
    date.setDate(date.getDate() + offset); 
    return date;
  };

  const getScheduleItem = (slotStartTime, dateStr) => {
    if (!Array.isArray(schedule)) return null;

    return schedule.find((item) => {
      const itemDateFormatted = item.date ? item.date.split("T")[0] : "";
      
      return (
        item.slot?.from === slotStartTime && 
        itemDateFormatted === dateStr 
      );
    });
  };

  // Effect để tạo các tuần và tìm ID người dùng
  useEffect(() => {
    // 1. Tạo tuần
    const newWeeks = generateWeeksOfYear(year);
    setWeeks(newWeeks);
    const currentDate = new Date();
    const currentWeek = newWeeks.find(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    setSelectedWeek(currentWeek || (newWeeks.length > 0 ? newWeeks[0] : null));

    // 2. Lấy ID người dùng
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const decoded = jwtDecode(token);
            setStudentId(decoded.id);
        } catch (e) {
            setError("Lỗi xác thực token.");
            setLoading(false);
        }
    } else {
        setError("Không tìm thấy token. Vui lòng đăng nhập.");
        setLoading(false);
    }
  }, [year]);


  // Effect để lấy dữ liệu lịch học (Chạy khi studentId thay đổi)
  useEffect(() => {
    if (!studentId) return;

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null); 

      const token = localStorage.getItem("token");

      try {
        // 🌟 SỬ DỤNG ĐƯỜNG DẪN CHÍNH XÁC
        const response = await axios.get(
          `${API_BASE_URL}/${studentId}${API_SCHEDULE_PATH}`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success && Array.isArray(response.data.data)) {
          setSchedule(response.data.data);
        } else {
          setError(
            response.data?.message || "Invalid schedule data format received from server."
          );
          setSchedule([]);
        }
      } catch (error) {
        setError(
          `Failed to fetch schedule. Message: ${error.response?.data?.message || error.message}`
        );
        setSchedule([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [studentId]); 

  if (loading) return <div className="p-6 text-xl font-semibold text-indigo-600">Đang tải lịch học...</div>;
  if (error) return <div className="p-6 text-xl font-semibold text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Lịch Học Của Học Sinh</h1>
      
      <div className="flex items-center gap-4 mb-4 bg-gray-50 p-3 rounded shadow-sm border">
        {/* Selector Năm và Tuần */}
        <label className="text-sm font-semibold text-gray-700">YEAR</label>
        <select
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="border px-3 py-2 rounded text-sm"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>

        <label className="text-sm font-semibold text-gray-700">WEEK</label>
        <select
          value={selectedWeek?.label || ""}
          onChange={(e) => {
            const week = weeks.find((w) => w.label === e.target.value);
            setSelectedWeek(week);
          }}
          className="border px-3 py-2 rounded text-sm max-w-[250px]"
        >
          {weeks.map((week) => (
            <option key={week.label} value={week.label}>
              {week.label}
            </option>
          ))}
        </select>
      </div>

      {selectedWeek ? (
        <table className="w-full border-collapse border border-gray-300 text-sm shadow-lg">
          <thead>
            <tr className="bg-blue-600 text-white text-center">
              <th className="border border-gray-300 p-2 font-bold w-[10%]">TIME</th>
              {daysOfWeek.map((day, idx) => {
                const date = getDateByOffset(selectedWeek.start, idx);
                const formattedDate = date
                  ? date.toLocaleDateString("en-GB")
                  : "";
                return (
                  <th key={day} className="border border-gray-300 p-2">
                    {day}
                    <br />
                    <span className="font-normal text-xs">{formattedDate}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slotLabels.map((slotStartTime, rowIdx) => (
              <tr key={slotStartTime} className="text-center">
                <td className="border border-gray-300 p-2 font-semibold bg-gray-100 text-gray-800">
                  {slotStartTime}
                </td>
                {daysOfWeek.map((_, colIdx) => {
                  const date = getDateByOffset(selectedWeek.start, colIdx);
                  const dateStr = formatDate(date);
                  const item = getScheduleItem(slotStartTime, dateStr);

                  return (
                    <td
                      key={colIdx}
                      className="border border-gray-300 p-2 text-left min-w-[150px] align-top bg-white hover:bg-indigo-50 transition duration-150"
                    >
                      {item ? (
                        <div className="space-y-1">
                          
                          <div className="text-sm font-bold text-indigo-700">
                            {item.class?.name}
                          </div>
                          
                          {item.class?.course && (
                            <div className="text-xs text-gray-600">
                              <span className="font-bold">Course:</span>{" "}
                              {item.class.course}
                            </div>
                          )}
                          {item.room?.name && (
                            <div className="text-xs text-gray-600">
                              <span className="font-bold">Room:</span>{" "}
                              {item.room.name}
                            </div>
                          )}
                          {item.slot?.from && item.slot?.to && (
                            <div className="text-xs text-gray-600">
                              <span className="font-bold">Time:</span>{" "}
                              {item.slot.from} - {item.slot.to}
                            </div>
                          )}
                           {/* HIỂN THỊ TRẠNG THÁI ĐIỂM DANH */}
                           <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(item.attendanceStatus)}`}>
                            {item.attendanceStatus.toUpperCase()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 p-6">No week selected or loading...</p>
      )}
    </div>
  );
}
