
const express = require("express");

const {
  getIdeas,
  createIdea,
  voteForIdea,
  getComments,
  createComment,
  updateIdeaStatus,
} = require("../controllers/ideaController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Idea routes
router.get("/", getIdeas);
router.post("/", createIdea);
router.post("/:id/vote", voteForIdea);

// Admin-only status update
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateIdeaStatus
);

// Comments routes
router.get("/:id/comments", getComments);
router.post("/:id/comments", createComment);

module.exports = router;
