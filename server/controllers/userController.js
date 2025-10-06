const userAccount = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Role = require("../models/Role");

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
    // const isValidPassword = password === account.password;
    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword)
    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      {
        id: account._id,
        userName: account.userName,
        roleId: account.roleId,
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
      // roleId: account.roleId || "NA",
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
