const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Input needs to be an email",
    },
    trim: true,
    required: [true, "User must enter a password!"],
  },
  name: String,
  password: {
    type: String,
    minLength: 8,
    required: [true, "User must enter a password!"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    minLength: 8,
    required: [true, "User must enter a password!"],
  },
  passwordChangedAt: { type: Date },
  userCreationDate: { type: Date, default: Date.now },
  habits: {
    type: [String],
    default: undefined,
    required: [false, "User must enter his/hers habits"],
  },
  currentStreak: Number,
  dateEndCurrentStreak: Date,
  dateBeginningCurrentStreak: Date,
  longestStreak: Number,
  dateEndLongestStreak: Date,
  dateBeginningLongestStreak: Date,
});

// Crypt password
userSchema.pre("save", async function cryptPassword(next) {
  // Check so this ONLY runs when making a change to the password. This guard clause returns if other field is being modified.
  if (!this.isModified("password")) return next();
  //   Hash de password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //   Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Correct passwrod function, returns true if same
userSchema.methods.correctPassword = async function (
  dbPassword,
  enteredPassword
) {
  return await bcrypt.compare(enteredPassword, dbPassword);
};

// Changes duplicate email error message
userSchema.post("save", function (error, doc, next) {
  if (error.code === 11000) {
    next(new Error("User with this email already existes!"));
  } else {
    next(error);
  }
});

// Return if password was changed after token creation to see if its valid
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtTimestamp < passwordChangedTimestamp;
  }
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
