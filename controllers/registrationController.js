const Registration = require("../models/habitsRegistrationModel");
const User = require("../models/userModel");
const moment = require("moment");
const tz = require("moment-timezone");

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

exports.editRegistrationById = async (req, res) => {
  try {
    // 1) Get habit entry id and body
    const { id } = req.params;
    const { habits } = req.body;
    // 2) Fetch entry by id
    const entry = await Registration.findById(id);
    // 3) Update registration
    entry.userHabitsAchievedDayRegistration = habits;
    await entry.save();
    // 4) Deliver response to client
    res.status(200).json({
      status: "Success:Entry updated!",
      data: { entry },
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not fetch data!",
      err: err.message,
    });
  }
};

exports.setCurrentStreak = async (req, res, next) => {
  try {
    // 1)Get user information from req which is created in route protection middleware
    const { user } = req;

    //2) Extract current date to exclude date from aggregation
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    // 3) Get last time a user failed to achieve a 100 completion percentage
    const userLastFail = await Registration.aggregate([
      {
        $match: {
          user: { $eq: user._id },
          completionPercentage: { $lt: 1 },
          registrationFinalDate: { $ne: convertedDateForMongoUTC },
        },
      },
      {
        $group: {
          _id: null,
          maxFailedDate: { $max: "$registrationFinalDate" },
        },
      },
    ]);

    const lastFailedDate = userLastFail[0].maxFailedDate;
    console.log("last failed date", lastFailedDate);

    // 4) Get array from which to calculate current streak
    const arrayCalculateStreak = await Registration.find({
      user: user._id,
      registrationFinalDate: {
        $gt: lastFailedDate,
        $lt: convertedDateForMongoUTC,
      },
    }).sort({ registrationFinalDate: -1 });

    const datesArray = arrayCalculateStreak.map(
      (ele) => ele.registrationFinalDate
    );

    // 5) Initialize vars to save later, beg of streak could change due to not consecutive registrations
    let begOfStreak = datesArray[datesArray.length - 1];
    const endOfStreak = datesArray[0];

    // 6) Get beginning and end of win streak
    for (let i = 0; i < datesArray.length; i++) {
      let date = moment.utc(datesArray[i]);
      let dateCompare = moment.utc(datesArray[i + 1]);
      let dateDiff;
      // Only run while your not in the last element of the array
      if (datesArray[i + 1]) {
        // Difference between dates
        dateDiff = date.diff(dateCompare, "d");
        if (dateDiff != 1) {
          // If registration is not consecutive, current date is end of streak
          begOfStreak = datesArray[i];
          // assign value
          break;
        }
      }
      console.log(datesArray[i + 1]);
      console.log(date, dateCompare, dateDiff);
      console.log(i);
    }

    // 7) Calcultate streka
    const currentStreak = moment
      .utc(endOfStreak)
      .diff(moment.utc(begOfStreak).subtract(1, "d"), "d");

    // 8)Update user document and registration document
    const currentUser = await User.findById(user.id).select("+password");
    currentUser.currentStreak = currentStreak;
    currentUser.dateEndCurrentStreak = endOfStreak;
    currentUser.dateBeginningCurrentStreak = begOfStreak;
    currentUser.passwordConfirm = currentUser.password;

    await currentUser.save();

    console.log(currentUser);

    console.log(endOfStreak, begOfStreak, currentStreak);

    console.log(userLastFail);
    console.log(datesArray);

    res.status(200).json({
      status: "Success:I am a test!",
    });

    // // Streak attached to req object
    // req.user.currentStreak = streak
    // next();
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "Route access denied!", err: err.message });
  }
};
