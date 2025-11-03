const Class = require("../models/Class");
const Schedule = require("../models/Schedule");
const User = require("../models/User");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const { 
  sendTeacherEnrollmentNotification,
  sendStudentApprovalEmail,
  sendStudentRejectionEmail
} = require("../services/emailService");
const weekdayToNumber = (weekday) => {
  const map = {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };
  return map[weekday];
};
// GET /api/classes
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()

      .populate("courseId", "name")
      .populate("teachers", "fullName email")
      .populate("students", "fullName email")
      .populate("schedule.slot", "from to")
      .populate("schedule.room", "name location type");
    res.status(200).json({
      success: true,
      message: "Classes retrieved successfully",
      data: classes,
    });
  } catch (error) {
    console.error("Error getting all classes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// POST /api/classes/add
const createClass = async (req, res) => {
  // BỎ QUA TRANSACTION ĐỂ TRÁNH LỖI REPLICA SET
  try {
    const {
      name, courseId, startDate, endDate, capacity, schedule, status, teachers, students,
    } = req.body;

    // ... (Kiểm tra bắt buộc và capacity cũ)
    if (
      !name || !courseId || !startDate || !endDate || !capacity ||
      !Array.isArray(schedule) || schedule.length === 0 ||
      !Array.isArray(teachers) || teachers.length === 0 ||
      !Array.isArray(students)
    ) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (students.length > capacity) {
      return res.status(400).json({ success: false, message: "Class is over capacity" });
    }

    // ----------------------------------------------------
    // 1. TẠO DANH SÁCH LỊCH HỌC CỤ THỂ (Schedule instances)
    // ----------------------------------------------------
    const classSchedules = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(0, 0, 0, 0); 
    end.setHours(23, 59, 59, 999); 
    
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); 

      schedule.forEach((recurringSch) => {
        const requiredDay = weekdayToNumber(recurringSch.weekday); 

        if (dayOfWeek === requiredDay) {
          // Chuẩn hóa ngày thành YYYY-MM-DDT00:00:00.000Z
          const dateOnly = new Date(currentDate.toISOString().split('T')[0]); 

          classSchedules.push({
            slotId: recurringSch.slot, 
            roomId: recurringSch.room, 
            date: dateOnly, 
          });
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (classSchedules.length === 0) {
       return res.status(400).json({
        success: false,
        message: "No class schedule can be generated in the specified date range.",
      });
    }

    // --------------------------------------------------------------------------
    // 2. KIỂM TRA TẤT CẢ CÁC TRƯỜNG HỢP TRÙNG LỊCH (Room, Teacher, Student)
    // --------------------------------------------------------------------------
    
    // Tạo mảng chỉ chứa các combo [slotId, roomId, date] duy nhất để kiểm tra
    const uniqueSchedules = Array.from(new Map(
        classSchedules.map(item => [`${item.slotId}-${item.roomId}-${item.date.toISOString()}`, item])
    ).values());
    
    const allConflictChecks = uniqueSchedules.map(async (sch) => {
      // Tải thông tin Slot để hiển thị lỗi chi tiết
      const slotInfo = await mongoose.model("Slot").findById(sch.slotId).select('from to').lean();
      const dateStr = sch.date.toISOString().split('T')[0];
      const timeStr = `${slotInfo?.from} - ${slotInfo?.to}`;
      const conflictDetails = { dateStr, timeStr };

      // 1. KIỂM TRA TRÙNG LỊCH PHÒNG HỌC (Room Conflict)
      const existingSchedule = await Schedule.findOne({
        slotId: sch.slotId,
        roomId: sch.roomId,
        date: sch.date, // So sánh ngày đã được chuẩn hóa (00:00:00Z)
      });

      if (existingSchedule) {
        const roomInfo = await mongoose.model("Room").findById(sch.roomId).select('name').lean();
        throw new Error(
          `Schedule conflict: Room ${roomInfo?.name} is already booked on ${conflictDetails.dateStr} at ${conflictDetails.timeStr}.`,
          { cause: { type: 'room_conflict', ...conflictDetails } }
        );
      }
      
      // 2. KIỂM TRA TRÙNG LỊCH GIÁO VIÊN (Teacher Conflict)
      // Tìm các lớp học khác có cùng slot và ngày
      const conflictingSchedules = await Schedule.find({
        slotId: sch.slotId,
        date: sch.date,
      }).select('classId').lean();
      
      if (conflictingSchedules.length > 0) {
        const conflictingClassIds = conflictingSchedules.map(s => s.classId);

        // Tìm các lớp học đang bị trùng lịch
        const conflictingClasses = await Class.find({
            _id: { $in: conflictingClassIds }
        }).select('teachers students name').lean();
        
        // Kiểm tra trùng lịch Giáo viên
        const teacherIds = teachers.map(t => t.toString());
        const conflictingTeacherClasses = conflictingClasses.filter(cls => 
          cls.teachers.some(t => teacherIds.includes(t.toString()))
        );

        if (conflictingTeacherClasses.length > 0) {
            const conflictingClassNames = conflictingTeacherClasses.map(cls => cls.name).join(', ');
            throw new Error(
                `Schedule conflict: One or more teachers are already teaching in class(es) [${conflictingClassNames}] on ${conflictDetails.dateStr} at ${conflictDetails.timeStr}.`,
                { cause: { type: 'teacher_conflict', ...conflictDetails } }
            );
        }

        // 3. KIỂM TRA TRÙNG LỊCH HỌC SINH (Student Conflict)
        const studentIds = students.map(s => s.toString());
        const conflictingStudentClasses = conflictingClasses.filter(cls => 
            cls.students.some(s => studentIds.includes(s.toString()))
        );

        if (conflictingStudentClasses.length > 0) {
            const conflictingClassNames = conflictingStudentClasses.map(cls => cls.name).join(', ');
            throw new Error(
                `Schedule conflict: One or more students are already enrolled in class(es) [${conflictingClassNames}] on ${conflictDetails.dateStr} at ${conflictDetails.timeStr}.`,
                { cause: { type: 'student_conflict', ...conflictDetails } }
            );
        }
      }
    });

    await Promise.all(allConflictChecks);

    // ----------------------------------------------------
    // 3. LƯU LỚP HỌC VÀ SCHEDULE (Nếu không có lỗi trùng lịch)
    // ----------------------------------------------------
    
    const newClass = new Class({
      name, courseId, startDate, endDate, capacity, schedule, 
      status: status || "ongoing", teachers, students,
    });

    // Bước 3a: Lưu Class
    const savedClass = await newClass.save(); 
    
    // Gắn classId
    const schedulesToSave = classSchedules.map((sch) => ({
      ...sch,
      classId: savedClass._id, 
    }));

    // Bước 3b: Lưu các buổi học cụ thể. Nếu có trùng lịch, Mongo sẽ báo lỗi 11000
    // Lỗi 11000 chỉ xảy ra khi có 2 request tạo cùng 1 schedule (slot/room/date) tại cùng 1 thời điểm
    // Chúng ta đã kiểm tra trước ở bước 2, nên trường hợp này rất hiếm
    await Schedule.insertMany(schedulesToSave); 
    
    res.status(201).json({
      success: true,
      message: "Class and Schedules created successfully",
      data: savedClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    
    // Xử lý lỗi trùng lịch do Pre-check (Nếu allConflictChecks throw lỗi)
    if (error.message.includes("Schedule conflict")) {
         // Lấy thông báo lỗi chi tiết từ error.message
         return res.status(409).json({ // Trả về 409
            success: false,
            message: error.message, // Thông báo lỗi chi tiết: 'Schedule conflict: Room ...'
            type: 'schedule_conflict' // Thêm type để frontend dễ nhận diện
        });
    }
    
    // Xử lý lỗi trùng lịch do Unique Index (error code 11000)
    if (error.code === 11000) { 
        // Đây là lỗi xảy ra khi có 2 request tạo cùng lúc.
        return res.status(409).json({ // Trả về 409
            success: false,
            message: "A concurrent schedule conflict was detected (Please try again).",
            type: 'schedule_conflict'
        });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// PUT /api/classes/update/:id
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Class.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("courseId", "name");
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE /api/classes/delete/:id
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Class.findByIdAndDelete(id);

    // Xóa các schedule cũ liên quan tới class
    await Schedule.deleteMany({ classId: id });

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting class:", error);
  }
};

const getAllClassesByUserId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const classes = await Class.find()
      .populate("courseId", "name")
      .populate("teachers", "fullName")
      .populate("schedule.slot", "from to")
      .lean();

    const formattedClasses = classes
      .filter((cls) => cls.students.some((s) => s.toString() === studentId))
      .map((cls) => ({
        _id: cls._id,
        name: cls.name,
        courseName: cls.courseId?.name || "N/A",
        teachers: cls.teachers || [],
        capacity: cls.capacity,
        status: cls.status || "ongoing",
        schedule: cls.schedule || [],
      }));

    res.status(200).json({
      success: true,
      message: "Classes retrieved successfully",
      data: formattedClasses,
    });
  } catch (error) {
    console.error("getAllClassesByUserId error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getClassesByUserId = async (req, res) => {
  const { classId } = req.params;
  try {
    const classData = await Class.findById(classId)
      .populate("teachers", "fullName")
      .populate("courseId", "name")
      .populate("students", "fullName email birthday")
      .populate({
        path: "schedule.slot",
        model: "Slot",
        select: "from to",
      });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const scheduleFormatted = classData.schedule.map((item) => ({
      weekday: item.weekday,
      from: item.slot?.from || "N/A",
      to: item.slot?.to || "N/A",
    }));

    res.json({
      _id: classData._id,
      name: classData.name,
      teacher: classData.teachers.map((t) => t.fullName).join(", "),
      schedule: scheduleFormatted,
      room: "Room 101",
      status: classData.status,
      courseName: classData.courseId?.name || "N/A",
      students: classData.students.map((s) => ({
        id: s._id,
        name: s.fullName,
        email: s.email,
        birthday: s.birthday ? s.birthday.toISOString().split("T")[0] : "N/A",
      })),
    });
  } catch (error) {
    console.error("Failed to fetch class details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRegisterableClasses = async (req, res) => {
  try {
    const { studentId } = req.params; // Đây là Mongo _id

    // 1. Tìm tất cả các Khóa học (Course) mà sinh viên này đã mua
    const enrolledCourses = await Course.find({ 
      students: studentId 
    }).select('_id').lean();
    
    const enrolledCourseIds = enrolledCourses.map(course => course._id);

    if (enrolledCourseIds.length === 0) {
      // Nếu sinh viên chưa mua khóa học nào, trả về mảng rỗng
      return res.status(200).json([]);
    }

    // 2. Tìm tất cả các Lớp học (Class) thuộc các khóa học đó
    let classes = await Class.find({ 
      courseId: { $in: enrolledCourseIds } 
    })
      .populate("courseId", "name")
      .populate("teachers", "fullName")
      .populate("schedule.slot", "from to") // <-- Populate schedule
      .populate("schedule.room", "name") // <-- Populate schedule
      .lean();
    
    // 3. Định dạng lại dữ liệu và thêm trạng thái đăng ký
    const registerableClasses = classes.map((cls) => {
      
      const isEnrolled = (cls.students || []).some(id => id.toString() === studentId);
      const isPending = (cls.pendingStudents || []).some(id => id.toString() === studentId);
      
      let enrollmentStatus = "none";
      if (isEnrolled) enrollmentStatus = "enrolled";
      else if (isPending) enrollmentStatus = "pending";

      return {
        _id: cls._id,
        name: cls.name || "N/A",
        courseId: cls.courseId?._id || null,
        courseName: cls.courseId?.name || "N/A",
        teachers: Array.isArray(cls.teachers) 
          ? cls.teachers.map(t => t?.fullName || "N/A").filter(Boolean).join(", ") 
          : "N/A",
        capacity: cls.capacity || 0,
        
        // Trả về ngày tháng
        startDate: cls.startDate,
        endDate: cls.endDate,

        schedule: Array.isArray(cls.schedule) && cls.schedule.length > 0
          ? cls.schedule.map(s => {
              return {
                weekday: s?.weekday || "N/A",
                from: s?.slot?.from || "N/A",
                to: s?.slot?.to || "N/A",
                room: s?.room?.name || "N/A"
              };
            })
          : [],
        studentsCount: Array.isArray(cls.students) ? cls.students.length : 0,
        status: cls.status || "inactive",
        
        // Trả về trạng thái đăng ký mới
        enrollmentStatus: enrollmentStatus, 
      };
    });

    res.status(200).json(registerableClasses);
  } catch (error) {
    console.error("Error fetching registerable classes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const enrollInClass = async (req, res) => {
  try {
    const mongoUserId = req.user?.id; // JWT user _id
    const classId = req.params.id; 

    // ... (Giữ nguyên phần validate IDs và User, từ dòng 470-488)
     if (!mongoose.Types.ObjectId.isValid(mongoUserId) || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, message: "Invalid ID(s)" });
    }
    const user = await User.findById(mongoUserId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // ...

    const foundClass = await Class.findById(classId).populate('teachers', 'fullName email'); // <-- Populate teachers
    if (!foundClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Check if already enrolled (trong 'students' hoặc 'pendingStudents')
    const isAlreadyEnrolled = foundClass.students.some((s) => s.toString() === mongoUserId);
    if (isAlreadyEnrolled) {
      return res.status(409).json({ success: false, message: "Already enrolled in this class" });
    }
    
    const isAlreadyPending = foundClass.pendingStudents.some((s) => s.toString() === mongoUserId);
    if (isAlreadyPending) {
      return res.status(409).json({ success: false, message: "Enrollment request is already pending" });
    }

    // Check capacity (Chỉ tính 'students' đã được duyệt)
    if (foundClass.students.length >= foundClass.capacity) {
      return res.status(400).json({ success: false, message: "Class is full" });
    }

    // ✅ THAY ĐỔI LOGIC: Thêm vào PENDING
    foundClass.pendingStudents.push(new mongoose.Types.ObjectId(mongoUserId));
    await foundClass.save();

    // ✅ GỬI EMAIL THÔNG BÁO CHO GIÁO VIÊN
    try {
      for (const teacher of foundClass.teachers) {
        sendTeacherEnrollmentNotification(teacher, user, foundClass);
      }
    } catch (emailError) {
      console.error("Failed to send teacher notification email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Successfully requested enrollment. Waiting for approval.",
    });
  } catch (error) {
    console.error("Error enrolling in class:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==========================================================
// HÀM MỚI (Thêm vào classController.js)
// ==========================================================
const getPendingEnrollments = async (req, res) => {
  try {
    const teacherId = req.user?.id; // Lấy ID giáo viên từ JWT

    // Tìm các lớp do giáo viên này dạy VÀ có sinh viên đang chờ duyệt
    const classes = await Class.find({
      teachers: teacherId,
      pendingStudents: { $exists: true, $not: { $size: 0 } }
    })
    .populate('courseId', 'name')
    .populate('pendingStudents', 'fullName email') // Populate thông tin SV chờ
    .lean();

    res.status(200).json({
      success: true,
      message: "Pending enrollments retrieved successfully",
      data: classes,
    });

  } catch (error) {
     console.error("Error fetching pending enrollments:", error);
     res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==========================================================
// HÀM MỚI (Thêm vào classController.js)
// ==========================================================
const approveEnrollment = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user?.id;

    const foundClass = await Class.findById(classId);

    // 1. Kiểm tra (Class tồn tại, Giáo viên dạy lớp này, SV có trong pending)
    if (!foundClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    if (!foundClass.teachers.some(t => t.toString() === teacherId)) {
       return res.status(403).json({ success: false, message: "You are not authorized to manage this class" });
    }
    if (!foundClass.pendingStudents.some(s => s.toString() === studentId)) {
       return res.status(404).json({ success: false, message: "Student not found in pending list" });
    }
     if (foundClass.students.length >= foundClass.capacity) {
      return res.status(400).json({ success: false, message: "Class is full" });
    }
    
    // 2. Di chuyển Student ID
    foundClass.pendingStudents.pull(studentId); // Xóa khỏi pending
    foundClass.students.addToSet(studentId); // Thêm vào students (addToSet an toàn)
    
    await foundClass.save();
    
    // 3. Gửi email cho sinh viên
    const student = await User.findById(studentId).lean();
    if (student) {
      sendStudentApprovalEmail(student, foundClass);
    }

    res.status(200).json({ success: true, message: "Student approved and enrolled" });

  } catch (error) {
     console.error("Error approving enrollment:", error);
     res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================================
// HÀM MỚI (Thêm vào classController.js)
// ==========================================================
const rejectEnrollment = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacherId = req.user?.id;

    const foundClass = await Class.findById(classId);

    // 1. Kiểm tra
    if (!foundClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
     if (!foundClass.teachers.some(t => t.toString() === teacherId)) {
       return res.status(403).json({ success: false, message: "You are not authorized to manage this class" });
    }

    // 2. Xóa Student ID khỏi pending
    foundClass.pendingStudents.pull(studentId);
    await foundClass.save();

    // 3. Gửi email cho sinh viên
    const student = await User.findById(studentId).lean();
    if (student) {
      sendStudentRejectionEmail(student, foundClass);
    }
    
    res.status(200).json({ success: true, message: "Student rejected" });

  } catch (error) {
     console.error("Error rejecting enrollment:", error);
     res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const unenrollFromClass = async (req, res) => {
  try {
    const classId = req.params.classid; // This is a Mongo ObjectId

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    // Step 1: Find user by app-level ID (e.g., "u4")
    const mongoUserId = req.user?.id; // MongoDB ObjectId from JWT

    if (!mongoose.Types.ObjectId.isValid(mongoUserId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(mongoUserId).lean(); // ✅ correct lookup
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Step 2: Find class
    const foundClass = await Class.findById(classId);
    if (!foundClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Step 3: Check if enrolled
    const index = foundClass.students.findIndex(
      (student) => student.toString() === mongoUserId.toString()
    );

    if (index === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    // Step 4: Remove student
    foundClass.students.splice(index, 1);
    await foundClass.save();

    return res.status(200).json({
      success: true,
      message: "Successfully unenrolled from class",
    });
  } catch (error) {
    console.error("Error unenrolling:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  getAllClassesByUserId,
  getClassesByUserId,
  getRegisterableClasses,
  enrollInClass,
  unenrollFromClass,
  getPendingEnrollments, 
  approveEnrollment, 
  rejectEnrollment, 
};
