const TeacherProfile = require("../models/teacherProfile");
const User = require("../models/user");

const createProfile = async (req, res) => {
  try {
    const { user, qualification, experience, experienceYears, specialization, bio, photo, socialLinks } =
      req.body;

    const targetUserId = user || req.user._id.toString();
    const isSelf = targetUserId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create this profile",
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.role !== "teacher") {
      throw new Error("Target user must exist and have the 'teacher' role");
    }

    const existing = await TeacherProfile.findOne({ user: targetUserId });
    if (existing) {
      throw new Error("Teacher profile already exists for this user");
    }

    const profile = new TeacherProfile({
      user: targetUserId,
      qualification,
      experience,
      experienceYears,
      specialization,
      bio,
      photo,
      socialLinks,
    });

    await profile.save();

    res.status(201).json({
      success: true,
      message: "Teacher profile created successfully",
      profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating teacher profile",
      Error: err.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const totalTeachers = await TeacherProfile.countDocuments();
    const [avgResult] = await TeacherProfile.aggregate([
      { $group: { _id: null, avgYears: { $avg: "$experienceYears" } } },
    ]);

    res.status(200).json({
      success: true,
      message: "Teacher stats fetched successfully",
      totalTeachers,
      averageExperienceYears: avgResult ? Math.round(avgResult.avgYears * 10) / 10 : 0,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching teacher stats",
      Error: err.message,
    });
  }
};

const searchProfiles = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      throw new Error("search query parameter is required");
    }

    const regex = new RegExp(search, "i");

    const profiles = await TeacherProfile.find({
      $or: [{ qualification: regex }, { bio: regex }, { specialization: regex }],
    }).populate("user", "name email profileImage");

    res.status(200).json({
      success: true,
      message: "Teacher profiles fetched successfully",
      profiles,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error searching teacher profiles",
      Error: err.message,
    });
  }
};

const getProfileByUserId = async (req, res) => {
  try {
    const profile = await TeacherProfile.findOne({
      user: req.params.userId,
    }).populate("user", "name email profileImage");

    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    res.status(200).json({
      success: true,
      message: "Teacher profile fetched successfully",
      profile,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching teacher profile",
      Error: err.message,
    });
  }
};

const listProfiles = async (req, res) => {
  try {
    const filter = {};

    if (req.query.specialization) filter.specialization = req.query.specialization;
    if (req.query.experience) filter.experienceYears = { $gte: Number(req.query.experience) };

    const profiles = await TeacherProfile.find(filter).populate(
      "user",
      "name email profileImage",
    );

    res.status(200).json({
      success: true,
      message: "Teacher profiles fetched successfully",
      profiles,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error fetching teacher profiles",
      Error: err.message,
    });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const { photo } = req.body;

    if (!photo) {
      throw new Error("photo URL is required");
    }

    const profile = await TeacherProfile.findById(req.params.profileId);

    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    const isSelf = profile.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this profile",
      });
    }

    profile.photo = photo;
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Teacher photo updated successfully",
      profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating teacher photo",
      Error: err.message,
    });
  }
};

const getProfileById = async (req, res) => {
  try {
    const profile = await TeacherProfile.findById(req.params.profileId).populate(
      "user",
      "name email profileImage",
    );

    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    res.status(200).json({
      success: true,
      message: "Teacher profile fetched successfully",
      profile,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "Error fetching teacher profile",
      Error: err.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profile = await TeacherProfile.findById(req.params.profileId);

    if (!profile) {
      throw new Error("Teacher profile not found");
    }

    const isSelf = profile.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this profile",
      });
    }

    const ALLOWED_UPDATES = [
      "qualification",
      "experience",
      "experienceYears",
      "specialization",
      "bio",
      "photo",
      "socialLinks",
    ];

    const isUpdateAllowed = Object.keys(req.body).every((key) =>
      ALLOWED_UPDATES.includes(key),
    );

    if (!isUpdateAllowed) {
      throw new Error("Invalid update field");
    }

    Object.assign(profile, req.body);
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully",
      profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating teacher profile",
      Error: err.message,
    });
  }
};

const deleteProfile = async (req, res) => {
    try {
      const profile = await TeacherProfile.findByIdAndDelete(req.params.profileId);

      if (!profile) {
        throw new Error("Teacher profile not found");
      }

      res.status(200).json({
        success: true,
        message: "Teacher profile deleted successfully",
        profile,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: "Error deleting teacher profile",
        Error: err.message,
      });
    }
  };

module.exports = {
  createProfile,
  getStats,
  searchProfiles,
  getProfileByUserId,
  listProfiles,
  updatePhoto,
  getProfileById,
  updateProfile,
  deleteProfile,
};
