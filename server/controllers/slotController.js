const Slot = require("../models/Slot");

/* ─────────── READ ─────────── */
// GET /api/slots
exports.getAllSlots = async (req, res) => {
  try {
    const slots = await Slot.find();
    res.status(200).json({
      success: true,
      message: "Slots retrieved successfully",
      data: slots,
    });
  } catch (error) {
    console.error("Error getting all slots:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
