const mongoose = require("mongoose");

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
  registrationCreationDate: { type: Date, default: Date.now },
  registrationModificationDate: { type: Date, default: undefined },
  registrationFinalDate: {
    type: Date,
    required: [true, "Registration needs to have a date"],
  },
});

// Setting completion percentage and status fields
habitsRegistrationSchema.pre("save", async function (next) {
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
  if (completionPercentage !== 1) {
    this.completionStatus = "In progress";
  }

  next();
});

habitsRegistrationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });

  next();
});

const Registration = mongoose.model(
  "Habits registration",
  habitsRegistrationSchema
);

module.exports = Registration;

// Note: Validatores only work on SAVE or Create. So when updating make it a save or create if not middleware will not work or validators.
