const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const OTP = require("../models/OTP");
const sendEmail = require("../utils/sendEmail");
const queueStudentSync = require("../utils/queueStudentSync");

const {
    normalizeEmail,
    isCollegeEmail,
    isValidSection,
    validateUsername,
    FAILED,
    OK
} = require("../utils/validation");

const {
    issueOTP,
    consumeOTP,
    findVerifiedOTP
} = require("../utils/otpService");

const SIGNUP_OTP_PURPOSE = "signup";
const RESET_OTP_PURPOSE = "reset";

const toPublicStudent = (student) => {
    const data = student.toObject ? student.toObject() : { ...student };
    delete data.password;
    return data;
};

const signToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

const isAdminConfigured = () =>
    Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

/**
 * Issues a signup OTP. Also used by the frontend to resend a code.
 */
const sendSignupOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.collegeEmail || req.body.email);

        if (!email) {
            return FAILED(res, 400, "College email is required");
        }

        if (!isCollegeEmail(email)) {
            return FAILED(res, 400, "Only ABES college email is allowed");
        }

        const existingStudent = await Student.findOne({ collegeEmail: email });

        if (existingStudent) {
            return FAILED(res, 409, "Student with this email already exists");
        }

        await issueOTP(email, SIGNUP_OTP_PURPOSE);

        return OK(res, 200, { message: "OTP sent successfully" });
    } catch (error) {
        console.error("sendSignupOTP failed:", error.message);
        return FAILED(res, 500, "Failed to send OTP. Please try again.");
    }
};

/**
 * Verifies a signup OTP without creating the account; account creation then
 * requires the same code to have been verified.
 */
const verifySignupOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.collegeEmail || req.body.email);
        const { otp } = req.body;

        if (!email || !otp) {
            return FAILED(res, 400, "College email and OTP are required");
        }

        const result = await consumeOTP(email, otp, SIGNUP_OTP_PURPOSE);

        if (!result.ok) {
            return FAILED(res, 400, result.message);
        }

        return OK(res, 200, { message: "Email verified successfully" });
    } catch (error) {
        console.error("verifySignupOTP failed:", error.message);
        return FAILED(res, 500, "OTP verification failed");
    }
};

const registerStudent = async (req, res) => {
    try {
        const {
            name,
            collegeEmail,
            email: rawEmail,
            password,
            rollNo,
            section,
            leetcodeUsername,
            codechefUsername,
            otp
        } = req.body;

        const email = normalizeEmail(collegeEmail || rawEmail);

        if (!email || !password || !name || !rollNo || !section) {
            return FAILED(res, 400, "All required fields must be provided");
        }

        if (!isCollegeEmail(email)) {
            return FAILED(res, 400, "Only ABES college email is allowed");
        }

        if (!isValidSection(section)) {
            return FAILED(res, 400, "Invalid section");
        }

        if (String(password).length < 6) {
            return FAILED(res, 400, "Password must be at least 6 characters");
        }

        const leetcode = validateUsername("leetcode", leetcodeUsername);

        if (!leetcode.valid) {
            return FAILED(res, 400, leetcode.message);
        }

        const codechef = validateUsername("codechef", codechefUsername);

        if (!codechef.valid) {
            return FAILED(res, 400, codechef.message);
        }

        /*
         * The email must have been verified in this session. When the client
         * sends the code along, it is re-checked so a stale verification
         * window cannot be reused for a different payload.
         */
        const verifiedOTP = await findVerifiedOTP(
            email,
            SIGNUP_OTP_PURPOSE,
            otp
        );

        if (!verifiedOTP) {
            return FAILED(res, 400, "Please verify your college email first");
        }

        const existingStudent = await Student.findOne({
            $or: [{ collegeEmail: email }, { rollNo }]
        });

        if (existingStudent) {
            return FAILED(
                res,
                409,
                "Student with this email or roll number already exists"
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await Student.create({
            name: String(name).trim(),
            collegeEmail: email,
            password: hashedPassword,
            rollNo: String(rollNo).trim(),
            section,
            leetcodeUsername: leetcode.username,
            codechefUsername: codechef.username
        });

        await OTP.deleteMany({ email, purpose: SIGNUP_OTP_PURPOSE });
        queueStudentSync(student);

        return OK(res, 201, {
            message: "Student registered successfully",
            student: toPublicStudent(student)
        });
    } catch (error) {
        console.error("registerStudent failed:", error.message);
        return FAILED(res, 500, "Registration failed");
    }
};

/**
 * Single login entry point for both roles.
 *
 * Admin credentials come from the environment; everything else is checked
 * against the student collection. The response is deliberately identical in
 * shape for an unknown email and a wrong password so the endpoint cannot be
 * used to discover which emails are registered.
 */
const login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.collegeEmail);
        const { password } = req.body;

        if (!email || !password) {
            return FAILED(res, 400, "Email and password are required");
        }

        if (
            isAdminConfigured() &&
            email === normalizeEmail(process.env.ADMIN_EMAIL) &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = signToken({ role: "admin" });

            return OK(res, 200, {
                message: "Login successful",
                token,
                role: "admin",
                user: {
                    name: "Administrator",
                    email: normalizeEmail(process.env.ADMIN_EMAIL)
                }
            });
        }

        const student = await Student.findOne({ collegeEmail: email });

        if (!student) {
            return FAILED(res, 401, "Invalid email or password");
        }

        const passwordMatch = await bcrypt.compare(password, student.password);

        if (!passwordMatch) {
            return FAILED(res, 401, "Invalid email or password");
        }

        const token = signToken({
            studentId: student._id,
            role: "student"
        });

        return OK(res, 200, {
            message: "Login successful",
            token,
            role: "student",
            user: toPublicStudent(student)
        });
    } catch (error) {
        console.error("login failed:", error.message);
        return FAILED(res, 500, "Login failed");
    }
};

const loginAdmin = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!isAdminConfigured()) {
            return FAILED(res, 500, "Admin is not configured");
        }

        if (
            email !== normalizeEmail(process.env.ADMIN_EMAIL) ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return FAILED(res, 401, "Invalid admin credentials");
        }

        const token = signToken({ role: "admin" });

        return OK(res, 200, {
            message: "Admin login successful",
            token,
            role: "admin"
        });
    } catch (error) {
        console.error("loginAdmin failed:", error.message);
        return FAILED(res, 500, "Admin login failed");
    }
};

/**
 * Starts the password reset flow by emailing a reset code.
 *
 * Responds with the same success message whether or not the address is
 * registered, so this cannot be used to enumerate student emails.
 */
const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.collegeEmail);

        if (!email) {
            return FAILED(res, 400, "Email is required");
        }

        const student = await Student.findOne({ collegeEmail: email });

        if (student) {
            try {
                await issueOTP(email, RESET_OTP_PURPOSE);
            } catch (sendError) {
                /*
                 * Only surface a send failure for a real account; otherwise
                 * the error itself would reveal that the email exists.
                 */
                console.error("forgotPassword send failed:", sendError.message);
                return FAILED(
                    res,
                    500,
                    "Failed to send OTP. Please try again."
                );
            }
        }

        return OK(res, 200, {
            message:
                "If that email is registered, a reset code has been sent."
        });
    } catch (error) {
        console.error("forgotPassword failed:", error.message);
        return FAILED(res, 500, "Failed to start password reset");
    }
};

const verifyResetOTP = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.collegeEmail);
        const { otp } = req.body;

        if (!email || !otp) {
            return FAILED(res, 400, "Email and OTP are required");
        }

        const result = await consumeOTP(email, otp, RESET_OTP_PURPOSE);

        if (!result.ok) {
            return FAILED(res, 400, result.message);
        }

        return OK(res, 200, { message: "OTP verified successfully" });
    } catch (error) {
        console.error("verifyResetOTP failed:", error.message);
        return FAILED(res, 500, "OTP verification failed");
    }
};

/**
 * Completes the reset. Requires a verified reset code, and the code is
 * consumed on success so it cannot be replayed.
 */
const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email || req.body.collegeEmail);
        const { otp, password, confirmPassword } = req.body;

        if (!email || !password) {
            return FAILED(res, 400, "Email and new password are required");
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return FAILED(res, 400, "Passwords do not match");
        }

        if (String(password).length < 6) {
            return FAILED(res, 400, "Password must be at least 6 characters");
        }

        const verifiedOTP = await findVerifiedOTP(
            email,
            RESET_OTP_PURPOSE,
            otp
        );

        if (!verifiedOTP) {
            return FAILED(res, 400, "Please verify your OTP first");
        }

        const student = await Student.findOne({ collegeEmail: email });

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        student.password = await bcrypt.hash(password, 10);
        await student.save();

        await OTP.deleteMany({ email, purpose: RESET_OTP_PURPOSE });

        return OK(res, 200, { message: "Password updated successfully" });
    } catch (error) {
        console.error("resetPassword failed:", error.message);
        return FAILED(res, 500, "Failed to reset password");
    }
};

/**
 * Returns the signed-in user. For an admin token there is no matching
 * student document, so a synthetic record is returned.
 */
const getCurrentUser = async (req, res) => {
    try {
        if (req.role === "admin") {
            return OK(res, 200, {
                user: {
                    name: "Administrator",
                    email: normalizeEmail(process.env.ADMIN_EMAIL),
                    role: "admin"
                }
            });
        }

        const student = await Student.findById(req.studentId).select(
            "-password"
        );

        if (!student) {
            return FAILED(res, 404, "Student not found");
        }

        return OK(res, 200, { user: toPublicStudent(student) });
    } catch (error) {
        console.error("getCurrentUser failed:", error.message);
        return FAILED(res, 500, "Failed to load profile");
    }
};

module.exports = {
    sendSignupOTP,
    verifySignupOTP,
    registerStudent,
    login,
    loginAdmin,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    getCurrentUser,
    toPublicStudent,
    queueStudentSync,
    signToken
};
