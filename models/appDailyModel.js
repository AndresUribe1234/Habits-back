const mongoose = require("mongoose");
const moment = require("moment");
const tz = require("moment-timezone");

const appDailySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
});

const Daily = mongoose.model("App daily", appDailySchema);

module.exports = Daily;
