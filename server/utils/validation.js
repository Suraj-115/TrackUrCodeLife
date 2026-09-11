const { SECTIONS } = require("../models/Student");

const EMAIL_DOMAIN = "@abes.ac.in";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isCollegeEmail = (email) => normalizeEmail(email).endsWith(EMAIL_DOMAIN);

const isValidSection = (section) => SECTIONS.includes(section);

/**
 * Platform handles reject anything the platforms themselves would not accept,
 * so a typo cannot be saved and then silently fail on every future sync.
 *
 * LeetCode allows letters, digits, underscore, hyphen and dot.
 * CodeChef additionally allows nothing outside letters, digits, underscore.
 */
const PLATFORM_PATTERNS = {
    leetcode: /^[A-Za-z0-9_.-]{2,40}$/,
    codechef: /^[A-Za-z0-9_]{2,40}$/
};

const validateUsername = (platform, value) => {
    const username = String(value || "").trim();

    if (!username) {
        return { valid: true, username: "" };
    }

    if (!PLATFORM_PATTERNS[platform].test(username)) {
        return {
            valid: false,
            message:
                platform === "leetcode"
                    ? "Invalid LeetCode ID. Use 2-40 letters, numbers, dots, dashes or underscores."
                    : "Invalid CodeChef ID. Use 2-40 letters, numbers or underscores."
        };
    }

    return { valid: true, username };
};

const FAILED = (res, status, message) =>
    res.status(status).json({ success: false, message });

const OK = (res, status, payload) =>
    res.status(status).json({ success: true, ...payload });

module.exports = {
    EMAIL_DOMAIN,
    normalizeEmail,
    isCollegeEmail,
    isValidSection,
    validateUsername,
    FAILED,
    OK
};
