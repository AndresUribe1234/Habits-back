const Registration = require("../models/habitsRegistrationModel");
const fs = require("fs");
const moment = require("moment");
const tz = require("moment-timezone");
const User = require("./../models/userModel");

exports.testMiddleware = async (req, res) => {
  try {
    console.log(req.body);
    const { id: userId } = req.body;
    const regDeleted = await Registration.deleteMany({ user: userId });

    res.status(200).json({
      status: "Success:Test working!",
      deleted: regDeleted,
    });
  } catch (err) {
    res.status(400).json({
      status: "Test middleware not working!",
      err: err.message,
    });
  }
};

exports.updateAllStreaks = async (req, res, next) => {
  try {
    // 1)Check if theres a daily document with today date
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    // 3)If theres no daily it means user collection has not been updated so proceed to update
    const allUsers = await User.find();

    console.log("Updating user profiles...");
    for (let ele of allUsers) {
      console.log("User being updated", ele.name);
      //   4)Check if user has a registration for today
      const currentRegistration = await Registration.findOne({
        user: ele._id,
        registrationFinalDate: convertedDateForMongoUTC,
      });

      // 5)If thats the case update user profile streak
      if (currentRegistration) {
        console.log("User has registration for today");
        console.log("");
        ele.currentStreak = currentRegistration.currentStreak;
        ele.dateBeginningCurrentStreak =
          currentRegistration.dateBeginningCurrentStreak;
        ele.dateEndCurrentStreak = currentRegistration.dateEndCurrentStreak;

        await ele.save();
        continue;
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

      if (yesterdayRegistration) {
        console.log("User has registration for yesterday");
        console.log("");
        ele.currentStreak = yesterdayRegistration.currentStreak;
        ele.dateBeginningCurrentStreak =
          yesterdayRegistration.dateBeginningCurrentStreak;
        ele.dateEndCurrentStreak = yesterdayRegistration.dateEndCurrentStreak;

        await ele.save();
        continue;
      }

      // 6)If theres no registration for previous day set current streak to zero
      if (!yesterdayRegistration && !currentRegistration) {
        console.log("User has no registration for today or yesterday");
        console.log("");
        ele.currentStreak = 0;
        ele.dateBeginningCurrentStreak = convertedDateForMongoUTC;
        ele.dateEndCurrentStreak = convertedDateForMongoUTC;

        await ele.save();
        continue;
      }
      console.log("");
    }

    // 8)Send response to client
    res.status(200).json({
      status: "Done with all updates!",
    });
  } catch (err) {
    res.status(400).json({
      status: "Could not update users information!",
      err: err.message,
    });
  }
};
