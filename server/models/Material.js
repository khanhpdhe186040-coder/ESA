const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const materialSchema = new Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    pdfUrl: { type: String }, // Will be populated for PPTX/PPT files
    public_id: { type: String, required: true },
    uploadedBy: { type: Types.ObjectId, ref: "User", required: true },
    classId: { type: Types.ObjectId, ref: "Class", required: true },
    fileType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Material", materialSchema);
