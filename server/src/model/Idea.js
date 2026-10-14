
const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Idea title is required"],
      trim: true,
      minlength: 5,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Idea description is required"],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "UI & Experience",
        "Notifications",
        "Productivity",
        "Integrations",
        "Other",
      ],
    },

    status: {
      type: String,
      enum: ["Planned", "In Progress", "Shipped"],
      default: "Planned",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    voteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Idea", ideaSchema);
