const Registration = require("../models/habitsRegistrationModel");
const User = require("../models/userModel");
const moment = require("moment");
const tz = require("moment-timezone");
const Daily = require("./../models/appDailyModel");

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

    // 3)Check if previous registration is consecutive and different from 100% completion
    const dayBeforeDateColTz = moment
      .utc()
      .tz("America/Bogota")
      .subtract(1, "d")
      .format("YYYY-MM-DD");

    const dayBeforeForMongo = new Date(dayBeforeDateColTz);

    const registrationDayBefore = await Registration.findOne({
      registrationFinalDate: dayBeforeForMongo,
      user: user._id,
    });

    console.log(registration);

    if (
      registrationDayBefore &&
      registrationDayBefore.completionPercentage !== 1 &&
      registration.completionPercentage !== 1
    ) {
      currentRegistration.currentStreak = 0;
      currentRegistration.dateBeginningCurrentStreak = upperDateLimit;
      currentRegistration.dateEndCurrentStreak = upperDateLimit;

      await currentRegistration.save();

      req.registration = currentRegistration;

      return next();
    }

    if (
      registrationDayBefore &&
      registrationDayBefore.completionPercentage !== 1 &&
      registration.completionPercentage === 1
    ) {
      currentRegistration.currentStreak = 1;
      currentRegistration.dateBeginningCurrentStreak = upperDateLimit;
      currentRegistration.dateEndCurrentStreak = upperDateLimit;

      await currentRegistration.save();

      req.registration = currentRegistration;

      return next();
    }

    // 4)Define query operation depending if registration day completion status is 100%

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

    // 5) Get last time a user failed to achieve a 100 completion percentage
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

    // 6) Define query object for query to get array from which to calculate current streak

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

    // 7)Get array from which to calculate current streak
    const arrayCalculateStreak = await Registration.find(
      queryForArrayToCalculateStreak
    ).sort({ registrationFinalDate: -1 });

    const datesArray = arrayCalculateStreak.map(
      (ele) => ele.registrationFinalDate
    );

    // 8) Initialize vars to save later, beg of streak could change due to not consecutive registrations
    let begOfStreak = datesArray[datesArray.length - 1];
    const endOfStreak = datesArray[0];

    // 9) Get beginning and end of win streak
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

    // 10) Calcultate strek
    let currentStreak;
    if (endOfStreak && begOfStreak) {
      currentStreak = moment
        .utc(endOfStreak)
        .diff(moment.utc(begOfStreak).subtract(1, "d"), "d");
    }

    if (!endOfStreak && !begOfStreak) {
      currentStreak = 0;
    }

    console.log(
      "beggining",
      "end",
      "current",
      begOfStreak,
      endOfStreak,
      currentStreak
    );

    // 11)Update user document and registration document
    currentRegistration.currentStreak = currentStreak;
    currentRegistration.dateEndCurrentStreak = endOfStreak;
    currentRegistration.dateBeginningCurrentStreak = begOfStreak;

    await currentRegistration.save();

    // Assigne value to recalculate streak
    req.registration = currentRegistration;

    // 12) Continue to next middleware or send response to client

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
      return next();
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

        console.log("beg,end,streak:", begOfStreak, endOfStreak, currentStreak);

        // 10)Update user document and registration document

        ele.currentStreak = currentStreak;
        ele.dateEndCurrentStreak = endOfStreak;
        ele.dateBeginningCurrentStreak = begOfStreak;

        await ele.save();
      }
    }

    next();
    // res.status(200).json({
    //   status: "Success:All current streaks are updated!",
    // });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Could not update current streaks!",
      err: err.message,
    });
  }
};

exports.calculateCurrentLongestStreakUser = async (req, res, next) => {
  try {
    // 1)Get user info
    const { user } = req;

    // 2)Get longest streak
    const longestStreak = await Registration.find({ user: user._id })
      .sort({ currentStreak: -1 })
      .limit(1);

    // 3)Set longest streak info on user document

    const currentUser = await User.findById(user._id);
    currentUser.longestStreak = longestStreak[0].currentStreak;
    currentUser.dateBeginningLongestStreak =
      longestStreak[0].dateBeginningCurrentStreak;
    currentUser.dateEndLongestStreak = longestStreak[0].dateEndCurrentStreak;

    //4)Get current streak
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    const registrationToday = await Registration.findOne({
      user: user._id,
      registrationFinalDate: convertedDateForMongoUTC,
    });
    let prevRegistration;

    if (!registrationToday) {
      const yesterdayDateColTz = moment
        .utc()
        .tz("America/Bogota")
        .subtract(1, "d")
        .format("YYYY-MM-DD");

      const yesterdayDateForMongo = new Date(yesterdayDateColTz);
      prevRegistration = await Registration.findOne({
        user: user._id,
        registrationFinalDate: yesterdayDateForMongo,
      });
    }

    // 5)Set current streak info on user document

    if (registrationToday) {
      currentUser.currentStreak = registrationToday.currentStreak;
      currentUser.dateBeginningCurrentStreak =
        registrationToday.dateBeginningCurrentStreak;
      currentUser.dateEndCurrentStreak = registrationToday.dateEndCurrentStreak;
    }

    if (prevRegistration) {
      currentUser.currentStreak = prevRegistration.currentStreak;
      currentUser.dateBeginningCurrentStreak =
        prevRegistration.dateBeginningCurrentStreak;
      currentUser.dateEndCurrentStreak = prevRegistration.dateEndCurrentStreak;
    }

    // 6)Save document

    await currentUser.save();

    // 7)Send response to clinete
    res.status(200).json({
      status: "Success:Current streak and longest streak information updated!",
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not update user information!",
      err: err.message,
    });
  }
};

exports.setCurrentStreakIfNoPreviousDay = async (req, res, next) => {
  try {
    // 1)Get user from req object
    const { user } = req;

    // 2)Check if user has registration for the day
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    const currentRegistration = await Registration.findOne({
      user: user._id,
      registrationFinalDate: convertedDateForMongoUTC,
    });

    // 4)If registration exist do nothing and jump to next middleware
    if (currentRegistration) {
      return next();
    }

    // 5)Check if user has a registration for the previous day
    const yesterdayDateColTz = moment
      .utc()
      .tz("America/Bogota")
      .subtract(1, "d")
      .format("YYYY-MM-DD");
    const yesterdayDateForMongo = new Date(yesterdayDateColTz);

    const yesterdayRegistration = await Registration.findOne({
      user: user._id,
      registrationFinalDate: yesterdayDateForMongo,
    });
    // 6)If theres no registration for previous day set current streak to zero

    if (!yesterdayRegistration) {
      const currentUser = await User.findById(user._id);

      currentUser.currentStreak = 0;
      currentUser.dateBeginningCurrentStreak = convertedDateForMongoUTC;
      currentUser.dateEndCurrentStreak = convertedDateForMongoUTC;
      await currentUser.save();

      return next();
    }

    next();
  } catch (err) {
    res.status(400).json({
      status: "Could not update user information!",
      err: err.message,
    });
  }
};

exports.calculateCurrentLongestStreakAppDaily = async (req, res, next) => {
  try {
    // 1)Check if theres a daily document with today date
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    const checkDaily = await Daily.findOne({ date: convertedDateForMongoUTC });

    // 2)If theres a task jump to next middleware
    if (checkDaily) {
      console.log(
        "Daily user profile update already done, leaving middleware..."
      );
      return next();
    }

    // 3)If theres no daily it means user collection has not been updated so proceed to update
    const allUsers = await User.find();

    if (!checkDaily) {
      console.log("Updating user profiles...");
      for (let ele of allUsers) {
        //   4)Check if user has a registration for today
        const currentRegistration = await Registration.findOne({
          user: ele._id,
          registrationFinalDate: convertedDateForMongoUTC,
        });

        // 5)If thats the case update user profile streak
        if (currentRegistration) {
          ele.currentStreak = currentRegistration.currentStreak;
          ele.dateBeginningCurrentStreak =
            currentRegistration.dateBeginningCurrentStreak;
          ele.dateEndCurrentStreak = currentRegistration.dateEndCurrentStreak;

          await ele.save();
        }

        // 5)Check if user has a registration for the previous day
        const yesterdayDateColTz = moment
          .utc()
          .tz("America/Bogota")
          .subtract(1, "d")
          .format("YYYY-MM-DD");
        const yesterdayDateForMongo = new Date(yesterdayDateColTz);

        const yesterdayRegistration = await Registration.findOne({
          user: ele._id,
          registrationFinalDate: yesterdayDateForMongo,
        });

        // 6)If theres no registration for previous day set current streak to zero
        if (!yesterdayRegistration && !currentRegistration) {
          ele.currentStreak = 0;
          ele.dateBeginningCurrentStreak = convertedDateForMongoUTC;
          ele.dateEndCurrentStreak = convertedDateForMongoUTC;

          await ele.save();
        }
      }
      // 7)Create daily so middleware does not repeat on next api route call
      const newDaily = await Daily.create({ date: convertedDateForMongoUTC });
    }

    // 8)Jump to next middleware
    next();
  } catch (err) {
    res.status(400).json({
      status: "Could not update users information!",
      err: err.message,
    });
  }
};
