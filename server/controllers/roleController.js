const roleModel = require("../models/Role");

exports.getAllRole = async (req, res, next) => {
  try {
    const roles = await roleModel.find({});
    res.status(200).json({
      message: "All roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};