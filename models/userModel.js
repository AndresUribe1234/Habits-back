const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  password: { type: String, required: [true, "User must enter a password!"] },
  date: { type: Date, default: Date.now },
  habits: {
    type: [String],
    default: undefined,
    required: [false, "User must enter his/hers habits"],
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
