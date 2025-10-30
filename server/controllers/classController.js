const Class = require("../models/Class");
const Schedule = require("../models/Schedule");
const User = require("../models/User");
const mongoose = require("mongoose");
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
    const { studentId } = req.params;
    //find all classes
    // First, get the raw classes without populating schedule
    let classes = await Class.find()
      .populate("courseId", "name")
      .populate("teachers", "fullName")
      .lean();
    console.log('Raw classes data before schedule population:', JSON.stringify(classes, null, 2));
    
    // Manually populate schedule for each class
    classes = await Promise.all(classes.map(async (cls) => {
      // Handle case where schedule might be in Schedule or schedule
      const scheduleData = cls.Schedule || cls.schedule || [];
      
      if (scheduleData.length > 0) {
        // Manually populate slot and room for each schedule item
        const populatedSchedule = await Promise.all(scheduleData.map(async (s) => {
          const populated = { ...s };
          
          if (s.slot) {
            const slot = await mongoose.model('Slot').findById(s.slot).select('from to').lean();
            populated.slot = slot || { from: 'N/A', to: 'N/A' };
          }
          
          if (s.room) {
            const room = await mongoose.model('Room').findById(s.room).select('name').lean();
            populated.room = room || { name: 'N/A' };
          }
          
          return populated;
        }));
        
        return { ...cls, schedule: populatedSchedule };
      }
      
      return { ...cls, schedule: [] };
    }));
    
    console.log('Classes after manual population:', JSON.stringify(classes, null, 2));

    const registerableClasses = classes.map((cls) => ({
      _id: cls._id,
      name: cls.name || "N/A",
      courseId: cls.courseId?._id || null,
      courseName: cls.courseId?.name || "N/A",
      teachers: Array.isArray(cls.teachers) 
        ? cls.teachers.map(t => t?.fullName || "N/A").filter(Boolean).join(", ") 
        : "N/A",
      capacity: cls.capacity || 0,
      schedule: Array.isArray(cls.schedule) && cls.schedule.length > 0  // Using lowercase to match schema
        ? cls.schedule.map(s => {  // Using lowercase to match schema
                    console.log('Processing schedule item:', JSON.stringify(s, null, 2));
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
      registered: Array.isArray(cls.students) 
        ? cls.students.some(id => id.toString() === studentId) 
        : false,
    }));

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
    console.log('Request user:', req.user); // Debug log
    console.log('Request params:', req.params); // Debug log
    
    const mongoUserId = req.user?.id; // JWT user _id
    const classId = req.params.id; // Now matches the route parameter
    
    console.log('Extracted IDs - User:', mongoUserId, 'Class:', classId); // Debug log

    // Validate IDs
    const isUserIdValid = mongoose.Types.ObjectId.isValid(mongoUserId);
    const isClassIdValid = mongoose.Types.ObjectId.isValid(classId);
    
    if (!isUserIdValid || !isClassIdValid) {
      console.error('Invalid IDs:', { 
        userId: mongoUserId, 
        classId,
        isUserIdValid,
        isClassIdValid 
      });
      return res.status(400).json({
        success: false,
        message: "Invalid ID(s)",
        debug: {
          mongoUserId,
          classId,
          mongoUserIdValid: mongoose.Types.ObjectId.isValid(mongoUserId),
          classIdValid: mongoose.Types.ObjectId.isValid(classId),
        },
      });
    }

    // Ensure user exists
    const user = await User.findById(mongoUserId).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Load the class
    const foundClass = await Class.findById(classId);
    if (!foundClass) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    // Check if already enrolled
    const isAlreadyEnrolled = foundClass.students.some(
      (s) => s.toString() === mongoUserId
    );
    if (isAlreadyEnrolled) {
      return res
        .status(409)
        .json({ success: false, message: "Already enrolled in this class" });
    }

    // Check capacity
    if (foundClass.students.length >= foundClass.capacity) {
      return res.status(400).json({ success: false, message: "Class is full" });
    }

    // ✅ Push raw ObjectId to the students array
    foundClass.students.push(new mongoose.Types.ObjectId(mongoUserId));
    await foundClass.save();

    res.status(200).json({
      success: true,
      message: "Successfully enrolled",
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
};
