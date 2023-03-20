const Registration = require("../models/habitsRegistrationModel");
const Stats = require("./../models/statsModel");
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

    const lastFailedDate = userLastFail[0] ? userLastFail[0].maxFailedDate : "";

    // 5) Define query object for query to get array from which to calculate current streak

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

    // 9) Calcultate streak
    let currentStreak;
    if (endOfStreak && begOfStreak) {
      currentStreak = moment
        .utc(endOfStreak)
        .diff(moment.utc(begOfStreak).subtract(1, "d"), "d");
    }

    if (!endOfStreak && !begOfStreak) {
      currentStreak = 0;
    }

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
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Could calculate user current streaks!",
    });
  }
};

exports.setRegistrationCurrentStreak = async (req, res, next) => {
  try {
    // 1)Get user information from req which is created in route protection middleware
    const { user, registration } = req;

    //2) Extract current date to exclude from comparison if date matches today
    let nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    //2) Get information from req object about registration
    const completion = registration.completionPercentage;
    const upperDateLimit = registration.registrationFinalDate;
    const registrationId = registration._id;

    // Find and assign current streak information for registration
    const currentRegistration = await Registration.findById(registrationId);

    if (completion < 1 && upperDateLimit < convertedDateForMongoUTC) {
      currentRegistration.currentStreak = 0;
      currentRegistration.dateBeginningCurrentStreak = upperDateLimit;
      currentRegistration.dateEndCurrentStreak = upperDateLimit;

      await currentRegistration.save();

      req.registration = currentRegistration;

      return next();
    }

    // 3)Define query operation depending if registration day completion status of 100%

    const conditionQueryOperation =
      completion === 1 &&
      upperDateLimit.getTime() === convertedDateForMongoUTC.getTime();

    let objectMatch = {
      user: { $eq: user._id },
      completionPercentage: { $lt: 1 },
      registrationFinalDate: { $lte: upperDateLimit },
    };

    if (
      completion !== 1 &&
      upperDateLimit.getTime() === convertedDateForMongoUTC.getTime()
    ) {
      objectMatch = {
        user: { $eq: user._id },
        completionPercentage: { $lt: 1 },
        registrationFinalDate: { $lt: convertedDateForMongoUTC },
      };
    }

    if (conditionQueryOperation) {
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

    const lastFailedDate = userLastFail[0] ? userLastFail[0].maxFailedDate : "";

    // 5) Define query object for query to get array from which to calculate current streak

    let queryForArrayToCalculateStreak = {
      user: user._id,
      registrationFinalDate: {
        $gt: lastFailedDate,
        $lte: upperDateLimit,
      },
      completionPercentage: 1,
    };

    if (!conditionQueryOperation && !lastFailedDate) {
      queryForArrayToCalculateStreak = {
        user: user._id,
        registrationFinalDate: {
          $lte: upperDateLimit,
        },
        completionPercentage: 1,
      };
    }

    if (conditionQueryOperation && lastFailedDate) {
      queryForArrayToCalculateStreak = {
        user: user._id,
        registrationFinalDate: {
          $gt: lastFailedDate,
          $lte: convertedDateForMongoUTC,
        },
        completionPercentage: 1,
      };
    }

    if (conditionQueryOperation && !lastFailedDate) {
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

    // 9) Calcultate strek
    let currentStreak;
    if (endOfStreak && begOfStreak) {
      currentStreak = moment
        .utc(endOfStreak)
        .diff(moment.utc(begOfStreak).subtract(1, "d"), "d");
    }

    if (!endOfStreak && !begOfStreak) {
      currentStreak = 0;
    }

    // 10)Update user document and registration document
    currentRegistration.currentStreak = currentStreak;
    currentRegistration.dateEndCurrentStreak = endOfStreak;
    currentRegistration.dateBeginningCurrentStreak = begOfStreak;

    await currentRegistration.save();

    // Assigne value to recalculate streak
    req.registration = currentRegistration;

    // 11) Continue to next middleware or send response to client

    next();
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Error:Could not calculate current streak!",
    });
  }
};

exports.reCalculateCurrentStreaks = async (req, res, next) => {
  try {
    // 1)Get registration information from req
    const { registration } = req;

    //2) Extract current date to exclude from comparison if date matches today
    let nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    if (
      registration.registrationFinalDate.getTime() ===
      convertedDateForMongoUTC.getTime()
    ) {
      return res.status(200).json({
        status: "Success:All current streaks are updated!",
      });
    }

    // 3) Get registrations for which current streak need to be re calculated
    const arrayOfEntriesToCalculate = await Registration.find({
      registrationFinalDate: { $gt: registration.registrationFinalDate },
      completionPercentage: 1,
      user: registration.user,
    }).sort({ registrationFinalDate: -1 });

    // Start updating each streak
    if (arrayOfEntriesToCalculate) {
      for (let ele of arrayOfEntriesToCalculate) {
        //4) Get information of each registration
        const upperDateLimit = ele.registrationFinalDate;

        // 3)Define query operation depending if registration day completion status of 100%

        const objectMatch = {
          user: { $eq: ele.user._id },
          completionPercentage: { $lt: 1 },
          registrationFinalDate: { $lte: upperDateLimit },
        };

        // 4) Get last time a user failed to achieve a 100 completion percentage
        const userLastFail = await Registration.aggregate([
          {
            $match: objectMatch,
          },
          { $sort: { registrationFinalDate: -1 } },
          {
            $group: {
              _id: null,

              maxFailedDate: { $max: "$registrationFinalDate" },
            },
          },
        ]);

        const lastFailedDate = userLastFail[0]
          ? userLastFail[0].maxFailedDate
          : "";

        // 5) Define query object for query to get array from which to calculate current streak

        let queryForArrayToCalculateStreak = {
          user: ele.user,
          registrationFinalDate: {
            $gt: lastFailedDate,
            $lte: upperDateLimit,
          },
          completionPercentage: 1,
        };

        if (!lastFailedDate) {
          queryForArrayToCalculateStreak = {
            user: ele.user,
            registrationFinalDate: {
              $lte: upperDateLimit,
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

        console.log("beg,end,streak:", begOfStreak, endOfStreak, currentStreak);

        // 10)Update user document and registration document

        ele.currentStreak = currentStreak;
        ele.dateEndCurrentStreak = endOfStreak;
        ele.dateBeginningCurrentStreak = begOfStreak;

        await ele.save();
      }
    }

    res.status(200).json({
      status: "Success:All current streaks are updated!",
    });
  } catch (err) {
    console.log(err);

    res.status(400).json({
      status: "Could not update current streaks!",
      err: err.message,
    });
  }
};
