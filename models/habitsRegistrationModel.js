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
  registrationCreationDate: { type: Date },
  registrationModificationDate: { type: Date, default: undefined },
  registrationFinalDate: {
    type: Date,
    required: [true, "Registration needs to have a date"],
  },
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

  const dateEntered = this.registrationFinalDate;
  //   Timezone option states what TZ is desired. If left UTC theres no change because dates are supposed to be on UTC.
  const dateEnteredString = dateEntered.toLocaleDateString("en-GB", {
    timeZone: "UTC",
  });
  //   Creation date on UTC
  const dateToCompare = new Date();
  //   Local time zone in GB date format: dd-mm-yyyy
  const dateColombianTz = dateToCompare.toLocaleDateString("en-GB");
  console.log(dateColombianTz, dateEnteredString);

  if (completionPercentage !== 1 && dateEnteredString === dateColombianTz) {
    this.completionStatus = "In progress";
  }
  if (completionPercentage !== 1 && dateEnteredString !== dateColombianTz) {
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
