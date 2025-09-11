const Course = require("../models/Course");
// GET /api/courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses,
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

// POST /api/courses/add
const createCourse = async (req, res) => {
  try {
    const { name, description, image, price, status, level } = req.body;

    const newCourse = new Course({
      name,
      description,
      image,
      price,
      status,
      level,
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

// PUT /api/courses/update/:id
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, price, status, level } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { name, description, image, price, status, level },
      { new: true, runValidators: true }
    );

    if (!updatedCourse)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
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

// DELETE /api/courses/delete/:id
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: deletedCourse,
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

module.exports = { getAllCourses, createCourse, updateCourse, deleteCourse };
