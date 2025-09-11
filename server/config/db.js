const mongoose = require("mongoose"); // npm i mongoose

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/SDNProject", {}); //Cai StudentMangementWeb co the thay doi bang ten database tren mongoDB neu khac
    console.log("MongoDB connected...");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
