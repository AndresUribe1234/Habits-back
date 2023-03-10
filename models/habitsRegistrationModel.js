const mongoose = require("mongoose");

const habitsRegistrationSchema = new mongoose.Schema({ name: String });

const Registration = mongoose.model(
  "Habits registration",
  habitsRegistrationSchema
);

module.exports = Registration;
