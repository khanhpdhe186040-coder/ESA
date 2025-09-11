const Room = require("../models/Room");
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
};

module.exports = { getAllRooms };
