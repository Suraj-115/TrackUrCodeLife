const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const studentRoutes = require("./routes/studentRoutes");

const startSyncScheduler = require("./services/sync/syncScheduler");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

connectDB();
startSyncScheduler();

app.use("/api/students", studentRoutes);


app.get("/", (req, res) => {
    res.send("TrackUrCodeLife API Running");
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TrackUrCodeLife API Running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
