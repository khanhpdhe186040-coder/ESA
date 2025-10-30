const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const attendanceSchema = new Schema(
  {
    // Tham chiếu đến buổi học cụ thể (instance of Schedule)
    scheduleId: {
      type: Types.ObjectId,
      ref: "Schedule",
      required: true,
      // Đảm bảo mỗi buổi học chỉ có 1 bản ghi điểm danh tổng (hoặc dùng index bên dưới)
    },
    // Tham chiếu đến Lớp học (optional, nhưng giúp truy vấn nhanh hơn)
    classId: {
      type: Types.ObjectId,
      ref: "Class",
      required: true,
    },
    // Tham chiếu đến Giáo viên điểm danh (optional, để ghi lại ai đã điểm danh)
    teacherId: {
      type: Types.ObjectId,
      ref: "User",
      required: false, // Có thể không bắt buộc ngay
    },
    // Danh sách các học sinh và trạng thái điểm danh của họ
    studentsAttendance: [
      {
        studentId: {
          type: Types.ObjectId,
          ref: "User",
          required: true,
        },
        // Trạng thái điểm danh: 'present', 'absent', 'late', 'excused'
        status: {
          type: String,
          enum: ["present", "absent", "late", "excused"],
          default: "absent",
          required: true,
        },
        // Ghi chú thêm cho từng học sinh (ví dụ: lý do vắng mặt)
        comment: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index Đảm bảo chỉ có một bản ghi điểm danh cho mỗi buổi học.
// Điều này ngăn việc tạo nhiều bản ghi Attendance cho cùng một scheduleId.
attendanceSchema.index({ scheduleId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);