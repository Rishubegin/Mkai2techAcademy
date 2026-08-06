const Notice = require("../models/notice");

const listNotices = async (req, res) => {
  try {
    const wantsAll = req.query.all === "true";

    if (wantsAll && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required to view all notices",
      });
    }

    let filter = {};
    if (!wantsAll) {
      const now = new Date();
      filter = {
        isActive: true,
        targetRole: { $in: ["all", req.user.role] },
        $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: now } }],
      };
    }

    const notices = await Notice.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Notices fetched successfully",
      notices,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching notices",
      Error: err.message,
    });
  }
};

const createNotice = async (req, res) => {
  try {
    const { title, message, targetRole, expiryDate, isActive } = req.body;

    const notice = await Notice.create({
      title,
      message,
      targetRole,
      expiryDate: expiryDate || undefined,
      isActive,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      notice,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating notice",
      Error: err.message,
    });
  }
};

const updateNotice = async (req, res) => {
  try {
    const ALLOWED_UPDATES = ["title", "message", "targetRole", "expiryDate", "isActive"];
    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );
    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!notice) {
      throw new Error("Notice not found");
    }

    res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      notice,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating notice",
      Error: err.message,
    });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      throw new Error("Notice not found");
    }

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error deleting notice",
      Error: err.message,
    });
  }
};

module.exports = {
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
