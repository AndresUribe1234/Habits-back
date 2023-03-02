const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
    required: [true, "User must enter a password!"],
  },
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
