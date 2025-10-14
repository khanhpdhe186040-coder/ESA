const Grades = require("../models/Grade");
const User = require("../models/User");

const Class = require("../models/Class");
const mongoose = require("mongoose");

const getAllGrades = async (req, res) => {
  try {
    const grades = await Grades.find();
    res.status(200).json({
      success: true,
      message: "Grades retrieved successfully",
      data: grades,
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

const createGrades = async (req, res) => {
  try {
    const { id, studentId, classId, courseId, score, type, date, comment } =
      req.body;

    const newGrades = new Grades({
      id,
      studentId,
      classId,
      courseId,
      score,
      type,
      date,
      comment,
    });

    const savedGrades = await newGrades.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: savedGrades,
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

const updateGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, price, status, level } = req.body;

    const updatedGrades = await Grades.findOneAndUpdate(
      { id: id },
      { name, description, image, price, status, level },
      { new: true, runValidators: true }
    );

    if (!updatedGrades) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedGrades,
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

const deleteGrades = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGrades = await Grades.findOneAndDelete({ id: id });

    if (!deletedGrades) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deletedGrades,
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

//get all grades of a student in all classes
const getAllGradesOfAStudentInAllClasses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const grades = await Grades.find({ studentId })
      .populate({
        path: "classId",
        select: "name courseId",
        populate: {
          path: "courseId",
          select: "name",
        },
      })
      .lean();

    if (!grades || grades.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No grades found for this student",
      });
    }

    const formattedGrades = grades.map((grade) => ({
      classId: grade.classId._id,
      className: grade.classId.name,
      courseName: grade.classId.courseId.name
      
    }));
    res.status(200).json({
      success: true,
      message: "Grades for the student retrieved successfully",
      data: formattedGrades,
    });
  } catch (error) {
    console.error("Error fetching grades for student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get grades of a student in a class

const getGradesOfAStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const grades = await Grades.find({ studentId, classId })
      .populate({
        path: "classId",
        select: "name courseId",
        populate: {
          path: "courseId",
          select: "name",
        },
      })
      .lean();
    if (!grades || grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No grades found for this student in the specified class",
      });
    }

    res.status(200).json({
      success: true,
      message: "Grades for the student retrieved successfully",
      data: grades,
    });
  } catch (error) {
    console.error("Error fetching grades for student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getGradesByClassId = async (req, res) => {
  try {
    const mongoUserId = req.user?.id; // Mongo _id from JWT
    const classIdParam = req.params.id;

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(mongoUserId) ||
      !mongoose.Types.ObjectId.isValid(classIdParam)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or class ID",
      });
    }

    // 1. Find student
    const user = await User.findById(mongoUserId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const studentMongoId = user._id;

    // 2. Find class
    const enrolledClass = await Class.findById(classIdParam).lean();
    if (!enrolledClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // 3. Check if the student is enrolled
    const isEnrolled = enrolledClass.students.some(
      (s) => s.toString() === studentMongoId.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this class",
      });
    }

    // 4. Filter grades based on ObjectIds
    const grades = await Grades.find({
      classId: classIdParam,
      studentId: studentMongoId,
    }).lean();

    // Optional: Map class name
    const classMap = {
      [enrolledClass._id.toString()]: enrolledClass.name,
    };

    const finalData = grades.map((grade) => ({
      class: classMap[grade.classId.toString()] || "Unknown Class",
      score: grade.score,
      comment: grade.comment,
    }));

    res.status(200).json({
      success: true,
      message: "Grades for the class retrieved successfully",
      data: finalData,
    });
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllGrades,
  createGrades,
  updateGrades,
  deleteGrades,
  getGradesOfAStudent,
  getGradesByClassId,
  getAllGradesOfAStudentInAllClasses,
};
