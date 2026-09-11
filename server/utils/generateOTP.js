const crypto = require("crypto");

/**
 * Generates a 6-digit OTP using a cryptographically secure source.
 *
 * Math.random() is predictable enough that an attacker who observes a few
 * codes could guess the next one, which matters for a value that grants
 * account access.
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

module.exports = generateOTP;
