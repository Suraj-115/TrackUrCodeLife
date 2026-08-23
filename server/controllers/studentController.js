const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const OTP = require("../models/OTP");
const sendEmail = require("../utils/sendEmail");

const registerStudent = async (req, res) => {
    try {
        const {
            name,
            collegeEmail,
            password,
            rollNo,
            section,
            leetcodeUsername,
            codechefUsername
        } = req.body;

        const email = collegeEmail.toLowerCase().trim();

        const verifiedOTP = await OTP.findOne({
            email,
            verified: true
        });

        if (!verifiedOTP) {
            return res.status(400).json({
                success: false,
                message: "Please verify your college email first"
            });
        }

        const existingStudent = await Student.findOne({
            $or: [
                { collegeEmail: email },
                { rollNo }
            ]
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: "Student with this email or roll number already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Student.create({
            name,
            collegeEmail: email,
            password: hashedPassword,
            rollNo,
            section,
            leetcodeUsername,
            codechefUsername
        });

        res.status(201).json({
            success: true,
            message: "Student registered successfully",
            student
        });
        await OTP.deleteOne({ _id: verifiedOTP._id });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const loginStudent = async (req, res) => {
    try {
        const { collegeEmail, password } = req.body;

        if (!collegeEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const email = collegeEmail.toLowerCase().trim();

        const student = await Student.findOne({
            collegeEmail: email
        });

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                studentId: student._id,
                role: "student"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

const sendOTP = async (req, res) => {
    try {
        const { collegeEmail } = req.body;

        if (!collegeEmail) {
            return res.status(400).json({
                success: false,
                message: "College email is required"
            });
        }

        const email = collegeEmail.toLowerCase().trim();

        // Only ABES college emails allowed
        if (!email.endsWith("@abes.ac.in")) {
            return res.status(400).json({
                success: false,
                message: "Only ABES college email is allowed"
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // OTP expires in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Remove previous OTP
        await OTP.deleteMany({ email });

        // Store new OTP
        await OTP.create({
            email,
            otp,
            expiresAt
        });

        // Send OTP
        await sendEmail(
            email,
            "TrackUrCodeLife - Email Verification",
            `Your OTP is ${otp}. It is valid for 5 minutes.`
        );

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { collegeEmail, otp } = req.body;

        if (!collegeEmail || !otp) {
            return res.status(400).json({
                success: false,
                message: "College email and OTP are required"
            });
        }

        const email = collegeEmail.toLowerCase().trim();

        const otpRecord = await OTP.findOne({
            email,
            otp
        });

        if (!otpRecord || otpRecord.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        otpRecord.verified = true;
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};

const getDashboard = async (req, res) => {
    try {
        const student = await Student.findById(
            req.studentId
        ).select("-password -otp -otpExpiresAt");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            student
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load dashboard"
        });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const {
            platform = "leetcode",
            metric = "contestRating",
            section
        } = req.query;

        if (!["leetcode", "codechef"].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: "Invalid platform"
            });
        }

        const allowedMetrics = [
            "problemsSolved",
            "contestRating",
            "contestsParticipated",
            "lastParticipatedContestDate"
        ];

        if (!allowedMetrics.includes(metric)) {
            return res.status(400).json({
                success: false,
                message: "Invalid metric"
            });
        }

        const query = {};

        if (section) {
            query.section = section;
        }

        const field = `${platform}Stats.${metric}`;

        const sort = { [field]: -1 };

        const students = await Student.find(query)
            .select(
                "_id name rollNo section " +
                "leetcodeStats codechefStats"
            )
            .sort(sort);

        const leaderboard = students.map((student, index) => {
            const stats =
                student[`${platform}Stats`];

            return {
                rank: index + 1,
                name: student.name,
                rollNo: student.rollNo,
                section: student.section,
                problemsSolved: stats.problemsSolved,
                contestRating: stats.contestRating,
                contestsParticipated:
                    stats.contestsParticipated,
                lastParticipatedContestDate:
                    stats.lastParticipatedContestDate,
                lastUpdated: stats.lastUpdated
            };
        });

        res.status(200).json({
            success: true,
            platform,
            metric,
            students,
            leaderboard
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load leaderboard"
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            email !== process.env.ADMIN_EMAIL ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        const token = jwt.sign(
            {
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Admin login successful",
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Admin login failed"
        });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({})
            .select(
                "name collegeEmail rollNo section " +
                "leetcodeUsername codechefUsername " +
                "leetcodeStats codechefStats"
            )
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const {
            name,
            rollNo,
            section,
            leetcodeUsername,
            codechefUsername
        } = req.body;

        const student = await Student.findById(req.studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        if (name !== undefined) student.name = name;
        if (rollNo !== undefined) student.rollNo = rollNo;
        if (section !== undefined) student.section = section;
        if (leetcodeUsername !== undefined) {
            student.leetcodeUsername = leetcodeUsername;
        }
        if (codechefUsername !== undefined) {
            student.codechefUsername = codechefUsername;
        }

        await student.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            student
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
};

const updateStudentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            rollNo,
            section,
            collegeEmail,
            leetcodeUsername,
            codechefUsername
        } = req.body;

        const student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        if (name !== undefined) student.name = name;
        if (rollNo !== undefined) student.rollNo = rollNo;
        if (section !== undefined) student.section = section;
        if (collegeEmail !== undefined) {
            student.collegeEmail = collegeEmail.toLowerCase().trim();
        }

        if (leetcodeUsername !== undefined) {
            student.leetcodeUsername = leetcodeUsername;
        }

        if (codechefUsername !== undefined) {
            student.codechefUsername = codechefUsername;
        }

        await student.save();

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            student
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }
};


const deleteStudentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByIdAndDelete(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }
};

module.exports = {
    registerStudent,
    sendOTP,
    verifyOTP,
    loginStudent,
    getDashboard,
    getLeaderboard,
    loginAdmin,
    getAllStudents,
    updateStudent,
    updateStudentByAdmin,
    deleteStudentByAdmin
};

