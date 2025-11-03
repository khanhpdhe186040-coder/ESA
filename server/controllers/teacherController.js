const Class = require('../models/Class');
const Schedule = require('../models/Schedule');
const Slot = require('../models/Slot');
const Room = require('../models/Room');
const User = require('../models/User');
const Course = require('../models/Course');
const Grade = require('../models/Grade');

// Get teaching schedule for a specific teacher
// Get teaching schedule for a specific teacher
const getTeachingSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const schedules = await Schedule.find()
      .populate('slotId', 'from to')
      .populate('roomId', 'name location')
      .populate({
        path: 'classId',
        select: 'name teachers courseId', // Đảm bảo lấy đủ teachers và courseId
        populate: [
          {
            path: 'courseId',
            select: 'name'
          }
          // Không cần populate teachers nữa vì đã select ở trên
        ]
      });

    if (!schedules || schedules.length === 0) { // Thêm kiểm tra length
      return res.status(200).json({ // Trả về 200 nếu không có lịch, chứ không phải 404
        success: true,
        message: "No schedule found",
        data: []
      });
    }

    const filteredSchedules = schedules.filter(item => {
      // BƯỚC 1: KIỂM TRA TẤT CẢ CÁC THAM CHIẾU CẦN THIẾT CÓ TỒN TẠI KHÔNG
      if (!item.classId || !item.slotId || !item.roomId || !item.classId.courseId) {
        console.warn(`Skipping schedule item ${item._id} due to missing references.`);
        return false;
      }
      // BƯỚC 2: KIỂM TRA GIÁO VIÊN CÓ THUỘC LỚP NÀY KHÔNG
      return item.classId.teachers.some(t => t.toString() === teacherId);
    }).map(item => ({
      id: item._id,
      slot: {
        // SỬ DỤNG OPTIONAL CHAINING (Không cần thiết nếu đã lọc ở trên, nhưng tốt cho phòng vệ)
        id: item.slotId._id, 
        from: item.slotId.from,
        to: item.slotId.to
      },
      room: {
        id: item.roomId._id,
        name: item.roomId.name,
        location: item.roomId.location
      },
      class: {
        id: item.classId._id,
        name: item.classId.name,
        // Đã lọc ra courseId null ở trên
        course: item.classId.courseId.name 
      },
      // Format date as YYYY-MM-DD
      date: item.date.toISOString().split('T')[0]
    }));

    res.status(200).json({
      success: true,
      message: "Schedule retrieved successfully",
      data: filteredSchedules
    });
  } catch (error) {
    console.error('Error getting schedule for teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
const getTeachingSlots = async (req, res) => {
  try {
    const slots = await Slot.find();
    if (!slots) {
      return res.status(404).json({
        success: false,
        message: "Slots not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Slots retrieved successfully",
      data: slots
    });
  } catch (error) {
    console.error('Error getting slots:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getTeachingClasses = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const classes = await Class.find()
      .populate('courseId', 'name');

    if (!classes || classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Classes not found for this teacher"
      });
    }
    const filteredClasses = classes.filter(c =>
      c.teachers.some(t => t._id.toString() === teacherId)
    ).map(c => ({
      id: c._id,
      name: c.name,
      course: c.courseId.name,
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate.toISOString().split('T')[0],
      capacity: c.capacity,
      status: c.status,
    }));

    res.status(200).json({
      success: true,
      message: "Classes retrieved successfully",
      data: filteredClasses
    });
  } catch (error) {
    console.error('Error getting classes for teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getTeachingClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const classDetails = await Class.findById(classId)
      .populate('courseId', 'name')
      .populate('teachers', 'fullName email')
      .populate('students', 'fullName email number birthday');

    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    const formattedClassDetails = {
      id: classDetails._id,
      name: classDetails.name,
      course: classDetails.courseId.name,
      startDate: classDetails.startDate.toISOString().split('T')[0],
      endDate: classDetails.endDate.toISOString().split('T')[0],
      capacity: classDetails.capacity,
      status: classDetails.status,
      material: classDetails.material,
      teachers: classDetails.teachers.map(t => ({
        id: t._id,
        name: t.fullName,
        email: t.email
      })),
      students: classDetails.students.map(s => ({
        id: s._id,
        name: s.fullName,
        email: s.email,
        number: s.number,
        birthday: s.birthday.toISOString().split('T')[0]
      }))
    };

    res.status(200).json({
      success: true,
      message: "Class details retrieved successfully",
      data: formattedClassDetails
    });
  } catch (error) {
    console.error('Error getting class details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getGradesOfAClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // First, get the class with all students
    const classDetails = await Class.findById(classId).populate('students', 'fullName');
    
    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Get existing grades for this class
    const existingGrades = await Grade.find({ classId: classId })
      .populate('studentId', 'fullName');

    // Create a map of existing grades by studentId
    const existingGradesMap = new Map();
    existingGrades.forEach(grade => {
      existingGradesMap.set(grade.studentId._id.toString(), grade);
    });

    // Prepare grades array - create new grades for students who don't have them
    const gradesToCreate = [];
    const allGrades = [];

    for (const student of classDetails.students) {
      const studentId = student._id.toString();
      
      if (existingGradesMap.has(studentId)) {
        // Student already has a grade
        const existingGrade = existingGradesMap.get(studentId);
        allGrades.push({
          id: existingGrade._id,
          student: { 
            id: existingGrade.studentId._id, 
            name: existingGrade.studentId.fullName 
          },
          score: existingGrade.score,
          comment: existingGrade.comment,
        });
      } else {
        // Student doesn't have a grade, prepare to create one
        gradesToCreate.push({
          classId: classId,
          studentId: student._id,
          score: {
            listening: 0,
            speaking: 0,
            reading: 0,
            writing: 0
          }, // Default null score
          comment: '' // Default empty comment
        });
      }
    }

    // Create new grades for students who don't have them
    if (gradesToCreate.length > 0) {
      const newGrades = await Grade.insertMany(gradesToCreate);
      
      // Add the newly created grades to the response
      newGrades.forEach(grade => {
        const student = classDetails.students.find(s => s._id.toString() === grade.studentId.toString());
        allGrades.push({
          id: grade._id,
          student: { 
            id: grade.studentId, 
            name: student.fullName 
          },
          score: grade.score,
          comment: grade.comment,
        });
      });
    }

    // Sort grades by student name for consistent ordering
    allGrades.sort((a, b) => a.student.name.localeCompare(b.student.name));

    res.status(200).json({
      success: true,
      message: "Grades retrieved successfully",
      data: allGrades
    });
  } catch (error) {
    console.error('Error getting grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getGradesOfAStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const grades = await Grade.find({ studentId: studentId, classId: classId })
    if (!grades || grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No grades found for this student"
      });
    }

    res.status(200).json({
      success: true,
      message: "Grades retrieved successfully",
      data: grades
    });
  } catch (error) {
    console.error('Error getting grades for student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const addGradeToAStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { score, comment } = req.body;

    const newGrade = new Grade({
      classId,
      studentId,
      score,
      comment
    });

    const savedGrade = await newGrade.save();

    res.status(201).json({
      success: true,
      message: "Grade added successfully",
      data: savedGrade
    });
  } catch (error) {
    console.error('Error adding grade:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateGradesOfAStudent = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { score, comment } = req.body;

    const updatedGrade = await Grade.findOneAndUpdate(
      { _id: gradeId },
      { score, comment },
      { new: true }
    );

    if (!updatedGrade) {
      return res.status(404).json({
        success: false,
        message: "Grade not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Grade updated successfully",
      data: updatedGrade
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseDetails = await Course.findById(courseId)

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course details retrieved successfully",
      data: courseDetails
    });
  } catch (error) {
    console.error('Error getting course details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};



module.exports = {
  getTeachingSchedule,
  getTeachingSlots,
  getTeachingClasses,
  getCourseDetails,
  getCourses,
  getTeachingClassDetails,
  getGradesOfAClass,
  getGradesOfAStudent,
  addGradeToAStudent,
  updateGradesOfAStudent,
};