const Registration = require("../models/habitsRegistrationModel");

exports.createNewHabit = async (req, res) => {
  try {
    console.log(req.user);
    // 1) Get user id from req object defined on previous middleware
    const { _id, habits } = req.user;
    // 2) Get registration information of req body
    const { habits: userHabitsAchievedDayRegistration } = req.body;
    // 3) Create documente
    const newHabit = await Registration.create({
      user: _id,
      userHabitsGoalDayRegistration: habits,
      userHabitsAchievedDayRegistration,
    });
    // 4) Send response to client
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

exports.getAllUserRegistrations = async (req, res) => {
  try {
    // 1) Get user id
    const { _id } = req.user;
    // 2) Find all user entries
    const allRegistrations = await Registration.find({ user: _id });
    // 3) Send data to client
    res.status(200).json({
      status: "Success:All user habits tracking entries where fetched!",
      data: { entries: allRegistrations },
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not fetch data!",
      err: err.message,
    });
  }
};
