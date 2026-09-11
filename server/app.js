const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const legacyRoutes = require("./routes/legacyRoutes");
const startSyncScheduler = require("./services/sync/syncScheduler");
const syncAllStudents = require("./services/sync/syncAllStudents");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

/*
 * The compatibility router is mounted first: it shares the "/api/students"
 * prefix with the student router, and its static paths ("/dashboard", "/me",
 * "/leaderboard") would otherwise be swallowed by "/:id".
 */
app.use("/api/students", legacyRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);

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

const start = async () => {
    await connectDB();
    startSyncScheduler();

    app.listen(PORT, () => {
        if (process.env.SYNC_ON_START === "true") {
            setTimeout(() => {
                syncAllStudents().catch((error) => {
                    console.error("Startup synchronization failed:", error.message);
                });
            }, 5000);
        }
    });
};

start().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});
