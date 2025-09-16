const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
  })
);

const connectDB = require("./connect/database");
const classRoute = require("./routes/classRoute");
const userRoute = require("./routes/userRoute");
const roleRoute = require("./routes/roleRoute");
const courseRoute = require("./routes/courseRoute");
const slotRoute = require("./routes/slotRoute");
// Swagger disabled

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/classes", classRoute);
app.use("/api/users", userRoute);
app.use("/api/roles", roleRoute);
app.use("/api/courses", courseRoute);
app.use("/api/slots", slotRoute);
app.use("/api/rooms", require("./routes/roomRoute"));
app.use("/api/teacher", require("./routes/teacherRoute"));
const studentRoute = require("./routes/studentRoute");


app.use("/api/schedule", require("./routes/scheduleRoute"));
app.use("/api/teacher", require("./routes/teacherRoute"));
app.use("/api/student", studentRoute);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpressJS" });
});

const PORT = process.env.PORT || 9999;
const HOSTNAME = "0.0.0.0";

app.listen(PORT, HOSTNAME, () => {
  console.log(`✅ Server is running at http://${HOSTNAME}:${PORT}`);
  // console.log(`✅ Swagger is running at http://localhost:${PORT}/api-docs`);
  connectDB();
});
