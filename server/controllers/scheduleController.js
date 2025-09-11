const Schedule = require("../models/Schedule");
const Room = require("../models/Room");
const Class = require("../models/Class");
const Slot = require("../models/Slot");
const User = require("../models/User");
const mongoose = require("mongoose");
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
    const schedules = await Schedule.find()
      .populate('slotId', 'from to')
      .populate('roomId', 'name location')
      .populate({
        path: 'classId',
        select: 'name',
        populate: [
          {
            path: 'courseId',
            select: 'name'
          },
          {
            path: 'teachers',
            select: '_id fullName'
          },
          {
            path: 'students',
            select: '_id fullName'
          }
        ]
      });

    if (!schedules) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    const filteredSchedules = schedules.filter(item =>
      item.classId?.students?.some(t => t._id.toString() === studentId)
    ).map(item => ({
      id: item._id,
      slot: {
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
        course: item.classId.courseId.name,
        teachers: item.classId.teachers.map(teacher => ({
          id: teacher._id,
          name: teacher.fullName
        })),
        students: item.classId.students.map(student => ({
          id: student._id,
          name: student.fullName
        }))
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
};
