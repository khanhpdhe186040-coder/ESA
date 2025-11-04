const Schedule = require("../models/Schedule");
const Attendance = require("../models/Attendance"); // 👈 FIX: Đã import Model Attendance
const Class = require("../models/Class"); // Thêm Class Model (cần cho logic lọc)
const User = require("../models/User"); // Thêm User Model (nếu cần sau này)
const getAllSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({});
    res.status(200).json({
      success: true,
      message: "Grades retrieved successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error getting all courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,

    });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { slotId, classId, roomId, date, meeting } = req.body;

    const newCourse = new Schedule({
      slotId,
      classId,
      roomId,
      date,
      meeting,
    });

    const savedCourse = await newCourse.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: savedCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotId, classId, roomId, date, meeting } = req.body;

    const updateSchedule = await Schedule.findOneAndUpdate(
      { id: id },
      { slotId, classId, roomId, date, meeting },
      { new: true, runValidators: true }
    );

    if (!updateSchedule) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updateSchedule,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteSchedule = await Schedule.findOneAndDelete({ id: id });

    if (!deleteSchedule) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deleteSchedule,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getStudentSchedule = async (req, res) => {
  try {
    const { studentId } = req.params;

    // B1: Lấy tất cả lịch trình mà học sinh này tham gia
    const schedules = await Schedule.find()
      .populate('slotId', 'from to')
      .populate('roomId', 'name location')
      .populate({
        path: 'classId',
        select: 'name',
        populate: [
          { path: 'courseId', select: 'name' },
          { path: 'teachers', select: '_id fullName' },
          { path: 'students', select: '_id fullName' }
        ]
      })
      .lean(); // Dùng .lean() để dễ dàng thêm thuộc tính mới

    if (!schedules || schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Schedule not found",
        data: [],
      });
    }

    // B2: Lọc các lịch trình mà học sinh này thực sự tham gia và lấy ra scheduleIds
    const filteredSchedules = schedules.filter(item => {
      // Bỏ qua nếu thiếu dữ liệu cơ bản
      if (!item.classId || !item.slotId) return false;
      
      // Kiểm tra xem studentId có tồn tại trong danh sách students của Class không
      return item.classId.students?.some(s => s._id?.toString() === studentId);
    });

    const scheduleIds = filteredSchedules.map(s => s._id);

    // B3: Lấy tất cả bản ghi điểm danh (Attendance) cho các schedules này
    const attendances = await Attendance.find({ 
        scheduleId: { $in: scheduleIds } 
    }).lean();

    // B4: Tạo Map để tra cứu nhanh trạng thái điểm danh theo scheduleId
    // Map: { scheduleId: attendanceStatus (present/absent/late/...) }
    const attendanceMap = attendances.reduce((map, att) => {
      const studentAtt = att.studentsAttendance.find(
          // Tìm trạng thái điểm danh của học sinh hiện tại
          (sa) => sa.studentId.toString() === studentId.toString()
      );
      if (studentAtt) {
          map.set(att.scheduleId.toString(), studentAtt.status);
      }
      return map;
    }, new Map());


    // B5: Kết hợp thông tin điểm danh vào kết quả cuối cùng
    const finalSchedules = filteredSchedules.map(item => {
      const scheduleIdStr = item._id.toString();
      
      // Lấy trạng thái điểm danh. Mặc định là 'pending' (chưa điểm danh) nếu không tìm thấy
      const attendanceStatus = attendanceMap.get(scheduleIdStr) || 'not yet'; 

      // Định dạng lại đối tượng trả về
      const slot = item.slotId ? {
        id: item.slotId._id,
        from: item.slotId.from || 'N/A',
        to: item.slotId.to || 'N/A'
      } : null;

      const room = item.roomId ? {
        id: item.roomId._id,
        name: item.roomId.name || 'N/A',
        location: item.roomId.location || 'N/A'
      } : { id: null, name: 'N/A', location: 'N/A' };

      const classInfo = item.classId ? {
        id: item.classId._id,
        name: item.classId.name || 'N/A',
        course: item.classId.courseId?.name || 'N/A',
        teachers: item.classId.teachers?.map(teacher => ({
          id: teacher?._id || null,
          name: teacher?.fullName || 'N/A'
        })) || [],
        students: item.classId.students?.map(student => ({
          id: student?._id || null,
          name: student?.fullName || 'N/A'
        })) || []
      } : null;

      return {
        id: item._id,
        slot,
        room,
        class: classInfo,
        date: item.date ? item.date.toISOString().split('T')[0] : 'N/A',
        attendanceStatus: attendanceStatus, // 🌟 Thuộc tính mới
      };
    });

    res.status(200).json({
      success: true,
      message: "Schedule retrieved successfully",
      data: finalSchedules
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getScheduleByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const schedules = await Schedule.find({ classId })
      .populate('slotId', 'from to')
      .populate('roomId', 'name')
      .sort({ date: 1 });
    
    // Format the response with only required fields
    const formattedSchedules = schedules.map(schedule => {
      // Format date as dd/MM/yyyy
      const date = new Date(schedule.date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      return {
        date: formattedDate,
        slot: {
          from: schedule.slotId?.from || 'N/A',
          to: schedule.slotId?.to || 'N/A'
        },
        room: schedule.roomId?.name || 'N/A'
      };
    });
    
    res.status(200).json({
      success: true,
      message: "Schedule retrieved successfully",
      data: formattedSchedules,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getStudentSchedule,
  getScheduleByClass
};
