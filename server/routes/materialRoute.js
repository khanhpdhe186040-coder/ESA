const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const express = require("express");
const Material = require("../models/Material");
const {authTeacher} = require("../middlewares/authTeacher");
const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp folder
const { 
    getAllMaterials, 
    downloadFile, 
    uploadFile, 
    getMaterialsByClass, 
    openFile, 
    deleteMaterial 
} = require("../controllers/materialController");
const {jwtAuth} = require("../middlewares/auth");

// Upload a file (requires authentication)
router.post("/upload/:classId", jwtAuth, upload.single("file"), uploadFile);

// Get all files
router.get("/", getAllMaterials);

// Download file (redirect to Cloudinary URL)
router.get("/download/:id", downloadFile);

// Get all files in class
router.get("/:classId", jwtAuth ,getMaterialsByClass);

// Open file on new tab
router.get("/open/:id", openFile);

// Route stream file gốc (proxy)
// router.get("/raw/:id", getRawFile);

// Delete a material
router.delete("/:id", jwtAuth, deleteMaterial);

module.exports = router;
