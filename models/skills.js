const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  title: String,
  description: String,
  skillCategory: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Skill", skillSchema);
