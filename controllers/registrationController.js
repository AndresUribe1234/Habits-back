const Registration = require("../models/habitsRegistrationModel");

exports.createNewHabit = async (req, res) => {
  try {
    const newHabit = await Registration.create({ name: "i am a test" });
    console.log("new habit", newHabit);
    res.status(200).json({
      status: "Success:User habit tracking progress was created!",
      //   data: { allUsers },
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not record user habit tracking progress for the day!",
      err: err.message,
    });
  }
};
