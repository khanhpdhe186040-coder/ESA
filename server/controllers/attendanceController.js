const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Class = require('../models/Class');
const mongoose = require('mongoose');
// const User = require('../models/User'); // Có thể cần nếu muốn lấy chi tiết user, nhưng đã populate

// Role ID của Học sinh (Đã xác định từ dữ liệu trước đó)
const STUDENT_ROLE_ID = 'r3'; 

// --- 1. Lấy hoặc Tạo bản ghi điểm danh ban đầu cho một buổi học cụ thể ---
const getAttendanceBySchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    // B1: Tìm bản ghi điểm danh (nếu đã tồn tại)
    let attendanceRecord = await Attendance.findOne({ scheduleId })
      .populate('studentsAttendance.studentId', 'fullName email') // Lấy thông tin học sinh
      .lean();

    if (attendanceRecord) {
      // B2: Nếu đã tồn tại, trả về ngay
      return res.status(200).json({
        success: true,
        message: 'Attendance record retrieved successfully',
        data: attendanceRecord
      });
    }

    // --- B3: Nếu chưa tồn tại, tạo bản ghi điểm danh ban đầu ---
    
    // 3a. Lấy thông tin Class ID từ Schedule
    const schedule = await Schedule.findById(scheduleId).select('classId').lean();
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // 3b. Lấy thông tin Class và populate danh sách students. 
    // PHẢI populate roleId để thực hiện lọc chính xác
    const classDetails = await Class.findById(schedule.classId)
      .select('students')
      .populate('students', 'fullName email roleId') // roleId là chìa khóa để lọc
      .lean();
      
    if (!classDetails) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // 3c. LỌC CHỈ GIỮ LẠI HỌC SINH (roleId === 'r3')
    const actualStudents = classDetails.students.filter(user => 
        // Lọc: chỉ giữ lại những người dùng có roleId là Học sinh
        user.roleId === STUDENT_ROLE_ID 
    );
    
    if (actualStudents.length === 0) {
        return res.status(200).json({ 
            success: true, 
            message: 'Class has no students registered with role ID r3.',
            data: { 
                scheduleId, 
                classId: schedule.classId, 
                studentsAttendance: [] // Trả về mảng rỗng để frontend dễ xử lý
            }
        });
    }


    // 3d. Khởi tạo trạng thái mặc định (absent)
    const initialAttendance = actualStudents.map(student => ({
      studentId: student._id,
      status: 'absent', // Mặc định là vắng
      comment: ''
    }));

    // 3e. Tạo và lưu bản ghi Attendance mới
    const newAttendance = new Attendance({
      scheduleId,
      classId: schedule.classId,
      // Lưu ý: req.user?.id lấy ID giáo viên từ middleware JWT (nếu có)
      teacherId: req.user?.id, 
      studentsAttendance: initialAttendance,
    });

    const savedAttendance = await newAttendance.save();
    
    // 3f. Populate lại để trả về data đầy đủ cho frontend
    const populatedNewAttendance = await Attendance.findById(savedAttendance._id)
      .populate('studentsAttendance.studentId', 'fullName email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Initial attendance record created and retrieved successfully',
      data: populatedNewAttendance
    });

  } catch (error) {
    console.error('Error getting/creating attendance:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// --- 2. Cập nhật trạng thái điểm danh ---
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params; // ID của bản ghi Attendance
    const { studentsAttendance } = req.body; // Mảng [ { studentId, status, comment }, ... ]
    
    const teacherId = req.user?.id; 

    // Cập nhật toàn bộ mảng studentsAttendance
    const updatedRecord = await Attendance.findByIdAndUpdate(
      attendanceId,
      { 
        // Thay thế toàn bộ mảng studentsAttendance với dữ liệu mới từ frontend
        studentsAttendance: studentsAttendance,
        teacherId: teacherId, 
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('studentsAttendance.studentId', 'fullName email')
    .lean();

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  getAttendanceBySchedule,
  updateAttendance,
};