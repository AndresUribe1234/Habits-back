const Registration = require("../models/habitsRegistrationModel");

exports.createNewHabit = async (req, res) => {
  try {
    // 1) Get user id from req object defined on previous middleware, user profile info
    const { _id, habits } = req.user;
    // 2) Get registration information of req body
    const { habits: userHabitsAchievedDayRegistration, registrationFinalDate } =
      req.body;
    // 3) Check if user does not have any entries for this date
    const regitrationDate = new Date(registrationFinalDate);
    const previousEntries = await Registration.find({ user: _id }).select(
      "registrationFinalDate"
    );
    const entriesDates = previousEntries.map((ele) =>
      ele.registrationFinalDate.getTime()
    );

    if (entriesDates.includes(regitrationDate.getTime())) {
      throw new Error(
        "Theres already a habit registration for this user for this date!"
      );
    }
    // 4) Create documente
    const newHabit = await Registration.create({
      user: _id,
      userHabitsGoalDayRegistration: habits,
      userHabitsAchievedDayRegistration,
      registrationFinalDate,
    });
    // 5) Send response to client
    res.status(200).json({
      status: "Success:User habit tracking progress was created!",
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

exports.getAllAppRegistrations = async (req, res) => {
  try {
    // 1) Find all app entries
    const allRegistrations = await Registration.find();
    // 3) Send data to client
    res.status(200).json({
      status: "Success:All app user habits tracking entries where fetched!",
      data: { entries: allRegistrations },
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not fetch data!",
      err: err.message,
    });
  }
};
