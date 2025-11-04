const { v2: cloudinary } = require("cloudinary");

// (Optional) quick visibility in server logs:
["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET"].forEach(k=>{
  if (!process.env[k]) console.warn(`[cloudinary] Missing ${k}`);
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
