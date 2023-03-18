const mongoose = require("mongoose");
const moment = require("moment");
const tz = require("moment-timezone");
const Registration = require("../models/habitsRegistrationModel");

exports.changingStatusEachDay = async () => {
  try {
    // 1)Get current day to avoide changing entries in progress
    const currentDayDate = moment
      .utc()
      .tz("America/Bogota")
      .format("YYYY-MM-DD");

    const currentDayDateJSFormat = new Date(currentDayDate);

    // 2)Find all entries that need to be updated
    const entriesToUpdate = await Registration.find({
      completionStatus: "In progress",
      registrationFinalDate: { $lt: currentDayDateJSFormat },
    });

    // 3)If theres no entries exit function
    if (entriesToUpdate.length < 1) {
      console.log("Theres nothing to update returning from function...");
      return;
    }

    // 4)Update entries
    entriesToUpdate.forEach(async (ele) => {
      ele.completionStatus = "Next time you will do better";
      await ele.save();
    });
  } catch (err) {
    console.log(err);
  }
};
