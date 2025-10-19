const userAccount = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Role = require("../models/Role");
const cloudinary = require("../config/cloudinary");
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
      image,
      roleId,
      status,
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
      image,
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

const uploadBufferToCloudinary = (buffer, opts = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", ...opts },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

exports.updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }
    if (
      updateData.status &&
      !["active", "inactive", "pending"].includes(updateData.status)
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    if (req.file && req.file.buffer) {
      const current = await userAccount
        .findById(userId)
        .select("imagePublicId");

      // Upload new image
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "profiles",
        overwrite: true,
      });

      updateData.image = result.secure_url;
      updateData.imagePublicId = result.public_id;
      if (current?.imagePublicId && current.imagePublicId !== result.public_id) {
        try {
          await cloudinary.uploader.destroy(current.imagePublicId);
        } catch (e) {
          console.warn("Failed to delete old Cloudinary image:", e?.message);
        }
      }
    }
    const updatedUser = await userAccount
      .findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
        context: "query",
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
    if (error?.message?.includes("Only JPG") || error?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message || error });
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