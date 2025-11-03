const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController'); // Điều chỉnh đường dẫn nếu cần
// const { verifyToken } = require('../middlewares/authMiddleware'); // Giả sử bạn có middleware xác thực

// Lưu ý: Bạn cần có một middleware xác thực (ví dụ: verifyToken) 
// để đảm bảo chỉ giáo viên đã đăng nhập mới có thể thực hiện điểm danh.

// [GET] /api/attendance/schedule/:scheduleId
// Lấy bản ghi điểm danh, nếu chưa có thì tạo bản ghi mặc định.
// Frontend sẽ truyền ID của buổi học cụ thể (Schedule._id)
router.get(
  '/schedule/:scheduleId', 
//   verifyToken, // Kích hoạt middleware này sau khi đã cài đặt
  attendanceController.getAttendanceBySchedule
);

// [PUT] /api/attendance/:attendanceId
// Cập nhật trạng thái điểm danh cho học sinh trong bản ghi Attendance
// Frontend sẽ truyền ID của bản ghi Attendance (_id) và gửi mảng studentsAttendance đã được chỉnh sửa
router.put(
  '/:attendanceId', 
//   verifyToken, // Kích hoạt middleware này sau khi đã cài đặt
  attendanceController.updateAttendance
);

module.exports = router;