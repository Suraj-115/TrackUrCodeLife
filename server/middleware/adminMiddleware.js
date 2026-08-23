const adminOnly = (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    next();
};

module.exports = adminOnly;