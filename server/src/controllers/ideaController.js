
const mongoose = require("mongoose");
const Idea = require("../model/Idea");
const Comment = require("../model/Comment");

// GET /api/ideas
async function getIdeas(req, res) {
  try {
    const {
      status,
      sort = "votes",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));

    const sortOptions =
      sort === "newest"
        ? { createdAt: -1 }
        : { voteCount: -1, createdAt: -1 };

    const [ideas, total] = await Promise.all([
      Idea.find(filter)
        .sort(sortOptions)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Idea.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: ideas,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get ideas error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ideas",
    });
  }
}

// POST /api/ideas
async function createIdea(req, res) {
  try {
    const { title, description, category } = req.body || {};

    const idea = await Idea.create({
      title,
      description,
      category,
    });

    return res.status(201).json({
      success: true,
      data: idea,
    });
  } catch (error) {
    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create idea error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create idea",
    });
  }
}

// POST /api/ideas/:id/vote
async function voteForIdea(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID",
      });
    }

    const idea = await Idea.findByIdAndUpdate(
      id,
      { $inc: { voteCount: 1 } },
      { new: true, runValidators: true }
    );

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: idea,
      message: "Vote recorded successfully",
    });
  } catch (error) {
    console.error("Vote error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to record vote",
    });
  }
}

// GET /api/ideas/:id/comments
async function getComments(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID",
      });
    }

    const ideaExists = await Idea.exists({ _id: id });

    if (!ideaExists) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    const comments = await Comment.find({ idea: id })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: comments,
      total: comments.length,
    });
  } catch (error) {
    console.error("Get comments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve comments",
    });
  }
}

// POST /api/ideas/:id/comments
async function createComment(req, res) {
  try {
    const { id } = req.params;
    const { text, authorName } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters",
      });
    }

    if (
      authorName !== undefined &&
      (typeof authorName !== "string" ||
        authorName.trim().length > 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Author name must be at most 50 characters",
      });
    }

    const idea = await Idea.findById(id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    const comment = await Comment.create({
      idea: idea._id,
      text: text.trim(),
      authorName:
        typeof authorName === "string" && authorName.trim()
          ? authorName.trim()
          : "Anonymous",
    });

    await Idea.updateOne(
      { _id: idea._id },
      { $inc: { commentCount: 1 } }
    );

    return res.status(201).json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create comment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
}

// PATCH /api/ideas/:id/status
async function updateIdeaStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid idea ID",
      });
    }

    const allowedStatuses = [
      "Planned",
      "In Progress",
      "Shipped",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Planned, In Progress, or Shipped",
      });
    }

    const idea = await Idea.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: "Idea not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Idea status updated successfully",
      data: idea,
    });
  } catch (error) {
    console.error("Update idea status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update idea status",
    });
  }
}

module.exports = {
  getIdeas,
  createIdea,
  voteForIdea,
  getComments,
  createComment,
  updateIdeaStatus,
};
