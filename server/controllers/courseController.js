const Course = require("../models/Course");
const User = require("../models/User");
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
// GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error getting course by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// ==========================================================

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

// GET /api/courses/public - Get all active courses (public, no auth required)
const getPublicCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: "active" });
    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses,
    });
  } catch (error) {
    console.error("Error getting public courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// GET /api/courses/:id/reviews - Get reviews for a course
const getCourseReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate({
      path: 'reviews.userId',
      select: 'fullName'
    });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reviews retrieved successfully",
      data: course.reviews || [],
    });
  } catch (error) {
    console.error("Error getting course reviews:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// POST /api/courses/:id/reviews - Add a review to a course
const addCourseReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Review text is required",
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if user already reviewed this course
    const existingReview = course.reviews.find(review => review.userId.toString() === userId);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    course.reviews.push({
      userId,
      text,
      upvotes: [],
      downvotes: [],
    });

    await course.save();

    const updatedCourse = await Course.findById(id).populate({
      path: 'reviews.userId',
      select: 'fullName'
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: updatedCourse.reviews[updatedCourse.reviews.length - 1],
    });
  } catch (error) {
    console.error("Error adding course review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// POST /api/courses/:courseId/reviews/:reviewId/upvote - Upvote a review
const upvoteReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;
    const { userId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const review = course.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Remove from downvotes if exists
    review.downvotes = review.downvotes.filter(id => id.toString() !== userId);
    
    // Toggle upvote
    const upvoteIndex = review.upvotes.findIndex(id => id.toString() === userId);
    if (upvoteIndex === -1) {
      review.upvotes.push(userId);
    } else {
      review.upvotes.splice(upvoteIndex, 1);
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Upvoted successfully",
      data: {
        upvotes: review.upvotes.length,
        downvotes: review.downvotes.length,
      },
    });
  } catch (error) {
    console.error("Error upvoting review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// POST /api/courses/:courseId/reviews/:reviewId/downvote - Downvote a review
const downvoteReview = async (req, res) => {
  try {
    const { courseId, reviewId } = req.params;
    const { userId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const review = course.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Remove from upvotes if exists
    review.upvotes = review.upvotes.filter(id => id.toString() !== userId);
    
    // Toggle downvote
    const downvoteIndex = review.downvotes.findIndex(id => id.toString() === userId);
    if (downvoteIndex === -1) {
      review.downvotes.push(userId);
    } else {
      review.downvotes.splice(downvoteIndex, 1);
    }

    await course.save();

    res.status(200).json({
      success: true,
      message: "Downvoted successfully",
      data: {
        upvotes: review.upvotes.length,
        downvotes: review.downvotes.length,
      },
    });
  } catch (error) {
    console.error("Error downvoting review:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { 
  getAllCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  getPublicCourses,
  getCourseReviews,
  addCourseReview,
  upvoteReview,
  downvoteReview,
  getCourseById,
};
