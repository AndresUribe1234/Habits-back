const Registration = require("../models/habitsRegistrationModel");

exports.createNewHabit = async (req, res, next) => {
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

    // 5)Attach registration to req object
    req.registration = newHabit;

    next();
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
    const allRegistrations = await Registration.find({ user: _id }).sort({
      registrationFinalDate: -1,
    });
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
    const allRegistrations = await Registration.find().sort({
      registrationFinalDate: -1,
    });
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

exports.getRegistrationById = async (req, res) => {
  // 1) Get habit entry id
  const { id } = req.params;
  // 2) Fetch entry by id
  const entry = await Registration.findById(id);
  // 3) Deliver response to client
  res.status(200).json({
    status: "Success:Entry fetched!",
    data: { entry },
  });
  try {
  } catch (err) {
    res.status(400).json({
      status: "Could not fetch data!",
      err: err.message,
    });
  }
};

exports.editRegistrationById = async (req, res, next) => {
  try {
    // 1) Get habit entry id and body
    const { id } = req.params;
    const { habits } = req.body;
    // 2) Fetch entry by id
    const entry = await Registration.findById(id);
    // 3) Update registration
    entry.userHabitsAchievedDayRegistration = habits;

    await entry.save();

    // 4)Attach registration to req object
    req.registration = entry;

    // 5)Send response to cliente
    // res.status(200).json({
    //   status: "Success:Entry was updated!",
    // });

    next();
  } catch (err) {
    res.status(400).json({
      status: "Could not update data!",
      err: err.message,
    });
  }
};
