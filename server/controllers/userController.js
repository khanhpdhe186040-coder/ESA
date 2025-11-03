const userAccount = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Role = require("../models/Role");
const Course = require("../models/Course");
const crypto = require('crypto');
const { 
    sendGuestRegistrationEmail, 
    sendStudentEnrollmentEmail 
} = require("../services/emailService");
exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      userName,
      password,
      email,
      number,
      birthday,
      address,
      roleId,
      status = "pending", // Default status to 'pending' if not provided
    } = req.body;
    const account = await userAccount.findOne({ userName });
    if (account) {
      return res.status(400).json({ message: "userName already exist" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new userAccount({
      fullName,
      userName,
      password: hashPassword,
      email,
      number,
      birthday,
      address,
      roleId,
      status,
    });

    const result = await newUser.save();
    if (result) {
      res.status(201).json({
        message: "Register successfully",
        data: result,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    const account = await userAccount.findOne({ userName });
    if (!account) {
      return res.status(401).json({ message: "Invalid username" });
    }
    if (account.status !== "active") {
      return res.status(403).json({ message: `Account is ${account.status}` });
    }
    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      {
        id: account._id,
        userName: account.userName,
        roleId: account.roleId,
        status: account.status,
      },
      process.env.JWT_KEY,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );
    res.status(200).json({
      message: "Login successfully",
      accessToken: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    const users = await userAccount.find({}).select("-password");
    const roles = await Role.find();
    const roleMap = roles.reduce((acc, role) => {
      acc[role.id] = role.name;
      return acc;
    }, {});

    const enrichedUsers = users.map((user) => ({
      ...user.toObject(),
      roleId: {
        id: user.roleId,
        name: roleMap[user.roleId] || user.roleId,
      },
    }));

    res.status(200).json({
      message: "All users fetched successfully",
      data: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userAccount.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = await Role.findOne({ id: user.roleId });
    const userWithRole = {
      ...user.toObject(),
      roleId: {
        id: user.roleId,
        name: role?.name || user.roleId,
      },
    };

    res
      .status(200)
      .json({ message: "User fetched successfully", data: userWithRole });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Server error or UserName / Email exists",
      error: error.message,
    });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    } else {
      delete updateData.password;
    }

    // Validate status if provided
    if (updateData.status && !['active', 'inactive', 'pending'].includes(updateData.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedUser = await userAccount
      .findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const role = await Role.findOne({ id: updatedUser.roleId });
    const userWithRole = {
      ...updatedUser.toObject(),
      roleId: {
        id: updatedUser.roleId,
        name: role?.name || updatedUser.roleId,
      },
    };

    res.status(200).json({
      message: "User updated successfully",
      data: userWithRole,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.GetUserByRoleId = async (req, res) => {
  try {
    const { roleId } = req.query;
    if (!roleId) {
      return res.status(400).json({ message: "Role ID is required" });
    }

    const users = await userAccount.find({ roleId }).select("-password");

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Course registration endpoint - creates user and enrolls in course

exports.registerForCourse = async (req, res, next) => {
  try {
    const {
      fullName,
      userName,
      email,
      number,
      birthday,
      address,
      courseId,
    } = req.body;

    // Validation
    if (!fullName || !userName || !email || !number || !birthday || !address || !courseId) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check if user already exists
    const existingUserByUsername = await userAccount.findOne({ userName });
    if (existingUserByUsername) {
      return res.status(400).json({ 
        success: false,
        message: "Username already exists" 
      });
    }

    const existingUserByEmail = await userAccount.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    // 1. Tìm khóa học
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    // Get student role (assuming roleId "r3" is student)
    const studentRole = await Role.findOne({ id: "r3" });
    if (!studentRole) {
      return res.status(500).json({ 
        success: false,
        message: "Student role not found" 
      });
    }

    // 2. Tạo mật khẩu ngẫu nhiên (ví dụ: 8 ký tự)
    const randomPassword = crypto.randomBytes(4).toString('hex'); // 4 bytes = 8 ký tự hex

    // 3. Hash mật khẩu ngẫu nhiên này
    const hashPassword = await bcrypt.hash(randomPassword, 10);

    // 4. Create new user với mật khẩu đã HASH
    const newUser = new userAccount({
      fullName,
      userName,
      password: hashPassword, // <-- Dùng mật khẩu đã hash
      email,
      number,
      birthday,
      address,
      roleId: studentRole.id,
      status: "active",
    });
    
    // 5. Lưu người dùng
    const savedUser = await newUser.save();

    // 6. Dùng $addToSet để ghi danh
    const updateResult = await Course.updateOne(
      { _id: courseId },
      { $addToSet: { students: savedUser._id } }
    );

    // 7. Gửi email với mật khẩu CHƯA HASH (plain text)
    if (updateResult.modifiedCount > 0) {
        // Gửi mật khẩu 'randomPassword' (chưa hash)
        sendGuestRegistrationEmail(savedUser, course, randomPassword); 
    }
   

    res.status(201).json({
      success: true,
      message: "Registration and enrollment successful!",
      data: {
        userId: savedUser._id,
        courseId: course._id,
      },
    });

  } catch (error) {
    console.error("Error in course registration:", error);
    next(error);
  }
};
//  Ghi danh sinh viên đã có tài khoản vào khóa học
exports.enrollExistingUser = async (req, res, next) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ 
        success: false,
        message: "userId and courseId are required" 
      });
    }

    // 1. Tìm người dùng (Vẫn cần để đảm bảo user tồn tại)
    const user = await userAccount.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // 2. Tìm khóa học (Vẫn cần để đảm bảo course tồn tại)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

  // 3. SỬA LỖI: Dùng updateOne VÀ KIỂM TRA KẾT QUẢ
    const updateResult = await Course.updateOne(
      { _id: courseId }, // Lọc
      { $addToSet: { students: user._id } } // Thao tác
    );

    // 4. CHỈ GỬI EMAIL NẾU DATABASE BỊ THAY ĐỔI
    // (updateResult.modifiedCount > 0) nghĩa là sinh viên vừa được thêm vào
    if (updateResult.modifiedCount > 0) {
        sendStudentEnrollmentEmail(user, course);
    }
    
    // 5. Trả về thành công
    res.status(200).json({
      success: true,
      message: "Enrollment successful!",
      data: {
        userId: user._id,
        courseId: course._id,
      },
    });

  } catch (error) {
    console.error("Error in enrolling existing user:", error);
    next(error);
  }
};