
const mongoose = require("mongoose");
const User = require("../model/User");

async function adminMiddleware(req, res, next) {
  try {
    if (
      !req.user ||
      !mongoose.isValidObjectId(req.user.userId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(req.user.userId)
      .select("role")
      .lean();

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin permission required",
      });
    }

    return next();
  } catch (error) {
    console.error("Admin authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
}

module.exports = adminMiddleware;
