const mongoose = require("mongoose");
const moment = require("moment");
const tz = require("moment-timezone");

const userStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Registration must belong to a user"],
  },
  currentStreak: Number,
  dateEndCurrentStreak: Date,
  dateBeginningCurrentStreak: Date,
  longestStreak: Number,
  dateEndLongestStreak: Date,
  dateBeginningLongestStreak: Date,
});

const Stats = mongoose.model("Stats", userStatsSchema);

module.exports = Stats;
