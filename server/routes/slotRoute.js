const { getAllSlots } = require("../controllers/slotController");
const SlotRouter = require("express").Router();
SlotRouter.get("/", getAllSlots);

module.exports = SlotRouter;
