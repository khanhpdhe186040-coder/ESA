//for file upload/download
/*
CLOUDINARY_NAME_FOR_MATERIAL = "dedg49jtt"
CLOUDINARY_KEY_FOR_MATERIAL = "643841232653329"
CLOUDINARY_SECRET_FOR_MATERIAL = "nvGRTHgq-AEnXFz0nos6Hc2fQYE"
 */
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME_FOR_MATERIAL,
    api_key: process.env.CLOUDINARY_KEY_FOR_MATERIAL,
    api_secret: process.env.CLOUDINARY_SECRET_FOR_MATERIAL,
});

module.exports = cloudinary;
