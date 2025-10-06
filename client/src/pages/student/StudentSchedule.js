import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Ensure you have this package installed

export default function StudentSchedule() {
  const [year, setYear] = useState(2025); // Mặc định năm 2025
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  // Đảm bảo schedule luôn là một mảng, khởi tạo với []
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const slotLabels = [
    "Slot 0",
    "Slot 1",
    "Slot 2",
    "Slot 3",
    "Slot 4",
    "Slot 5",
  ];

  // Ánh xạ từ slot index (rowIdx) sang thời gian bắt đầu thực tế của slot
  const slotStartTimes = [
    "08:00", // Slot 0: 08:00 - 09:30
    "09:40", // Slot 1: 09:40 - 11:10
    "13:00", // Slot 2: 13:00 - 14:30
    "14:40", // Slot 3: 14:40 - 16:10
    "18:00", // Slot 4: 18:00 - 19:30
    "19:40", // Slot 5: 19:40 - 21:10
  ];

  const generateWeeksOfYear = (targetYear) => {
    const startDate = new Date(`${targetYear}-01-01`);
    // Điều chỉnh để startDate là ngày thứ Hai đầu tiên của năm
    while (startDate.getDay() !== 1) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < 53; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Ngừng nếu tuần bắt đầu trong năm tiếp theo và không phải tuần đầu tiên của năm đó
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

  // Hàm này tìm kiếm trong mảng 'schedule'
  // Bây giờ nó sẽ tìm dựa trên slot.from và date từ dữ liệu backend
  const getScheduleItem = (slotId, dateStr) => {
    if (!Array.isArray(schedule)) {
      console.error(
        "Schedule state is not an array, cannot call find(). Current value:",
        schedule
      );
      return null;
    }

    const expectedStartTime = slotStartTimes[parseInt(slotId, 10)]; // Lấy thời gian bắt đầu từ mảng ánh xạ

    if (!expectedStartTime) {
      console.warn(`No start time defined for slotId: ${slotId}`);
      return null;
    }

    // Log các giá trị tìm kiếm để debug
    console.log(`--- Searching for item ---`);
    console.log(`  Target Date (dateStr): ${dateStr}`);
    console.log(`  Target Start Time (expectedStartTime): ${expectedStartTime}`);
    console.log(`  Current Schedule Array Length: ${schedule.length}`);

    return schedule.find((item) => {
      // Chắc chắn rằng item.date được định dạng YYYY-MM-DD từ ISO string của backend
      const itemDateFormatted = item.date ? item.date.split("T")[0] : "";

      // Log từng item để xem có khớp không
      console.log(`    Checking item: date=${item.date} (formatted=${itemDateFormatted}), from=${item.slot?.from}`);

      return (
        item.slot && // Đảm bảo item.slot tồn tại (thay vì item.slotTime)
        item.slot.from === expectedStartTime && // So sánh với thời gian bắt đầu
        itemDateFormatted === dateStr // So sánh chính xác chuỗi ngày tháng đã format
      );
    });
  };

  // Effect để tạo các tuần khi năm thay đổi
  useEffect(() => {
    const newWeeks = generateWeeksOfYear(year);
    setWeeks(newWeeks);
    // Tìm tuần hiện tại thay vì chọn tuần đầu tiên
    const currentDate = new Date();
    const currentWeek = newWeeks.find(week => 
      currentDate >= week.start && currentDate <= week.end
    );
    setSelectedWeek(currentWeek || (newWeeks.length > 0 ? newWeeks[0] : null));
    console.log("Generated weeks:", newWeeks);
    console.log("Selected week:", currentWeek || newWeeks[0]);
  }, [year]);

  // Effect để lấy dữ liệu lịch học
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null); // Reset lỗi trước mỗi lần fetch

      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("No token found. Please log in again.");
        return;
      }

      const studentId = jwtDecode(token).id; // Lấy ID học sinh từ token

      try {
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/schedule`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Schedule API Response:", response.data);

        // Lấy đúng mảng từ thuộc tính 'data' của phản hồi
        if (response.data && Array.isArray(response.data.data)) {
          setSchedule(response.data.data);
          console.log(
            "Fetched Schedule Data (set to state):",
            response.data.data
          ); // Log dữ liệu sau khi set
        } else {
          console.warn(
            "API response.data.data is not an array or is missing 'data' property:",
            response.data
          );
          setError("Invalid schedule data format received from server.");
          setSchedule([]); // Đảm bảo schedule là mảng rỗng để tránh lỗi
        }
      } catch (error) {
        console.error(
          "Error fetching schedule:",
          error.response?.status,
          error.response?.data
        );
        setError(
          `Failed to fetch schedule. Status: ${
            error.response?.status
          }, Message: ${error.response?.data?.message || error.message}`
        );
        setSchedule([]); // Đặt lại là mảng rỗng khi có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []); // Dependency array rỗng, chỉ fetch 1 lần khi component mount

  if (loading) return <div className="p-6">Loading schedule...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-semibold">YEAR</label>
        <select
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="border px-3 py-2 rounded text-sm"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>

        <label className="text-sm font-semibold">WEEK</label>
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
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-blue-200 text-center">
              <th className="border border-gray-300 p-2 font-bold">WEEK</th>
              {daysOfWeek.map((day, idx) => {
                const date = getDateByOffset(selectedWeek.start, idx);
                const formattedDate = date
                  ? date.toLocaleDateString("en-GB")
                  : "";
                return (
                  <th key={day} className="border border-gray-300 p-2">
                    {day}
                    <br />
                    {formattedDate}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slotLabels.map((slotLabel, rowIdx) => (
              <tr key={slotLabel} className="text-center">
                <td className="border border-gray-300 p-2 font-semibold">
                  {slotLabel}
                </td>
                {daysOfWeek.map((_, colIdx) => {
                  const date = getDateByOffset(selectedWeek.start, colIdx);
                  const dateStr = formatDate(date);
                  // Lấy item lịch học dựa trên slotId (rowIdx) và ngày
                  const item = getScheduleItem(`${rowIdx}`, dateStr);

                  // Debug log để kiểm tra
                  if (rowIdx === 0 && colIdx === 0) {
                    console.log(`Table cell debug - Row ${rowIdx}, Col ${colIdx}:`);
                    console.log(`  Date object:`, date);
                    console.log(`  Date string (dateStr):`, dateStr);
                    console.log(`  Found item:`, item);
                  }

                  return (
                    <td
                      key={colIdx}
                      className="border border-gray-300 p-2 text-left min-w-[150px] align-top"
                    >
                      {item ? (
                        <div className="space-y-1">
                          <div>
                            <span className="font-bold">Class:</span>{" "}
                            {item.class?.name}
                          </div>
                          {/* item.class.course từ backend */}
                          {item.class?.course && (
                            <div>
                              <span className="font-bold">Course:</span>{" "}
                              {item.class.course}
                            </div>
                          )}
                          {item.room?.name && (
                            <div>
                              <span className="font-bold">Room:</span>{" "}
                              {item.room.name}
                            </div>
                          )}
                          {/* Hiển thị thời gian từ slot của backend */}
                          {item.slot?.from && item.slot?.to && (
                            <div>
                              <span className="font-bold">Time:</span>{" "}
                              {item.slot.from} - {item.slot.to}
                            </div>
                          )}
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
        <p className="text-gray-500">No week selected or loading...</p>
      )}
    </div>
  );
}
