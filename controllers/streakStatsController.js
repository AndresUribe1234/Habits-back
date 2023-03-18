const Registration = require("../models/habitsRegistrationModel");
const User = require("../models/userModel");
const moment = require("moment");
const tz = require("moment-timezone");

exports.setUserCurrentStreak = async (req, res, next) => {
  try {
    // 1)Get user information from req which is created in route protection middleware
    const { user } = req;

    //2) Extract current date to exclude date from aggregation
    let nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    // 3)Define query operation depending if registration matches current day and has completion status of 100%
    const checkCurrentDayRegistration = await Registration.findOne({
      user: user._id,
      completionPercentage: 1,
      registrationFinalDate: convertedDateForMongoUTC,
    });

    let objectMatch = {
      user: { $eq: user._id },
      completionPercentage: { $lt: 1 },
      registrationFinalDate: { $lt: convertedDateForMongoUTC },
    };

    if (checkCurrentDayRegistration) {
      objectMatch = {
        user: { $eq: user._id },
        completionPercentage: { $lt: 1 },
        registrationFinalDate: { $lte: convertedDateForMongoUTC },
      };
    }

    // 4) Get last time a user failed to achieve a 100 completion percentage
    const userLastFail = await Registration.aggregate([
      {
        $match: objectMatch,
      },
      {
        $group: {
          _id: null,
          maxFailedDate: { $max: "$registrationFinalDate" },
        },
      },
    ]);

    console.log(userLastFail);

    const lastFailedDate = userLastFail[0] ? userLastFail[0].maxFailedDate : "";

    // 5) Define query object for query to gett array from which to calculate current streak

    let queryForArrayToCalculateStreak = {
      user: user._id,
      registrationFinalDate: {
        $gt: lastFailedDate,
        $lt: convertedDateForMongoUTC,
      },
      completionPercentage: 1,
    };

    if (checkCurrentDayRegistration && lastFailedDate) {
      queryForArrayToCalculateStreak = {
        user: user._id,
        registrationFinalDate: {
          $gt: lastFailedDate,
          $lte: convertedDateForMongoUTC,
        },
        completionPercentage: 1,
      };
    }

    if (checkCurrentDayRegistration && !lastFailedDate) {
      queryForArrayToCalculateStreak = {
        user: user._id,
        registrationFinalDate: {
          $lte: convertedDateForMongoUTC,
        },
        completionPercentage: 1,
      };
    }

    // 6)Get array from which to calculate current streak
    const arrayCalculateStreak = await Registration.find(
      queryForArrayToCalculateStreak
    ).sort({ registrationFinalDate: -1 });

    const datesArray = arrayCalculateStreak.map(
      (ele) => ele.registrationFinalDate
    );

    // 7) Initialize vars to save later, beg of streak could change due to not consecutive registrations
    let begOfStreak = datesArray[datesArray.length - 1];
    const endOfStreak = datesArray[0];

    // 8) Get beginning and end of win streak
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
    }

    // 9) Calcultate streka
    let currentStreak;
    if (endOfStreak && begOfStreak) {
      currentStreak = moment
        .utc(endOfStreak)
        .diff(moment.utc(begOfStreak).subtract(1, "d"), "d");
    }

    if (!endOfStreak && !begOfStreak) {
      currentStreak = 0;
    }

    console.log(begOfStreak, endOfStreak, currentStreak);

    // 10)Update user document and registration document
    const currentUser = await User.findById(user.id).select("+password");
    currentUser.currentStreak = currentStreak;
    currentUser.dateEndCurrentStreak = endOfStreak;
    currentUser.dateBeginningCurrentStreak = begOfStreak;
    currentUser.passwordConfirm = currentUser.password;

    await currentUser.save();

    req.user.currentStreak = currentStreak;
    req.user.dateEndCurrentStreak = endOfStreak;
    req.user.dateBeginningCurrentStreak = begOfStreak;

    // 11) Continue to next middleware or send response to client

    next();

    // res.status(200).json({
    //   status: "Success:User current streak was updated!",
    // });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Could not calculate current streak!",
      err: err.message,
    });
  }
};

exports.setLongestStreak = async (req, res, next) => {
  try {
    const { user } = req;
    // 1)Fetch current user
    const currentUser = await User.findById(user._id);

    // 2)Check if user has old streak information
    if (
      !currentUser.longestStreak ||
      !currentUser.dateEndLongestStreak ||
      !currentUser.dateBeginningLongestStreak ||
      currentUser.longestStreak <= currentUser.currentStreak
    ) {
      currentUser.longestStreak = currentUser.currentStreak;
      currentUser.dateEndLongestStreak = currentUser.dateEndCurrentStreak;
      currentUser.dateBeginningLongestStreak =
        currentUser.dateBeginningCurrentStreak;
      await currentUser.save();
    }

    console.log(currentUser);

    // 3)Send response to client
    res.status(200).json({
      status: "Success:User longest streak was updated!",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Could not calculate longest streak!",
      err: err.message,
    });
  }
};
