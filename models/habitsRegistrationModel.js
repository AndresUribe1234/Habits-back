const mongoose = require("mongoose");
const moment = require("moment");
const tz = require("moment-timezone");

const habitsRegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Registration must belong to a user"],
  },
  userHabitsGoalDayRegistration: {
    type: [String],
    default: undefined,
    required: [true, "Registration needs to have user habits goal"],
  },
  userHabitsAchievedDayRegistration: {
    type: [String],
    default: [],
    required: [true, "Registration needs to have user habits goal"],
  },
  completionPercentage: Number,
  completionStatus: String,
  registrationCreationDate: { type: Date },
  registrationModificationDate: { type: Date, default: undefined },
  registrationFinalDate: {
    type: Date,
    required: [true, "Registration needs to have a date"],
  },
  currentStreak: Number,
});

// Date creation and modifications timestamps
habitsRegistrationSchema.pre("save", function (next) {
  if (!this.registrationCreationDate) {
    this.registrationCreationDate = Date.now();
  } else {
    this.registrationModificationDate = Date.now();
  }

  next();
});

// Setting completion percentage and status fields
habitsRegistrationSchema.pre("save", function (next) {
  //   Get values for habits done and habits that user should done
  const numHabitsAchieved = this.userHabitsAchievedDayRegistration.length;
  const numHabitsGoal = this.userHabitsGoalDayRegistration.length;
  const completionPercentage = numHabitsAchieved / numHabitsGoal;

  //   Set completion percentage field
  this.completionPercentage = completionPercentage;

  //   Set completion status field
  if (completionPercentage === 1) {
    this.completionStatus = "Success";
  }

  // Formating corresponding registration date
  const dateEnteredMoment = moment
    .utc(this.registrationFinalDate)
    .format("YYYY-MM-DD");
  console.log(dateEnteredMoment);

  //   Creating a date to compare entered date in order to see if it matches the same day in col tz
  const dateToCompareMoment = moment
    .utc()
    .tz("America/Bogota")
    .format("YYYY-MM-DD");

  if (completionPercentage !== 1 && dateEnteredMoment === dateToCompareMoment) {
    this.completionStatus = "In progress";
  }
  if (completionPercentage !== 1 && dateEnteredMoment !== dateToCompareMoment) {
    this.completionStatus = "Next time you will do better";
  }

  next();
});

habitsRegistrationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: ["name", "email"],
  });

  next();
});

const Registration = mongoose.model(
  "Habits registration",
  habitsRegistrationSchema
);

module.exports = Registration;

// Note: Validatores only work on SAVE or Create. So when updating make it a save or create if not middleware will not work or validators.
