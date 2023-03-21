const Registration = require("../models/habitsRegistrationModel");
const moment = require("moment");
const tz = require("moment-timezone");
const User = require(`${__dirname}/../models/userModel`);

exports.getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find({});

    res.status(200).json({
      status: "Success:All users where fetched!",
      data: { allUsers },
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ status: "Could not fetch all users!", err: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    // 1) Get unique identifier of user
    const { email } = req.params;

    // 2)Check if user exist
    const userRequested = await User.findOne({ email: email });
    if (!userRequested) {
      throw new Error("User does not exist!");
    }

    // 3)Return user
    res.status(200).json({
      status: "Success:User requested was fetched!",
      data: { user: userRequested },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "Could not fetch user!", err: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const { name, habits } = req.body;

    // 1) Find user to update
    const usertToUpdate = await User.findOne({ email: email });

    // 2)Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        habits,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // 3)Update habits for registration of the day
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    const currentRegistration = await Registration.findOne({
      user: req.user._id,
      registrationFinalDate: convertedDateForMongoUTC,
    });

    if (currentRegistration) {
      currentRegistration.userHabitsGoalDayRegistration = habits;
      await currentRegistration.save();
    }

    // 4) Send okay to client
    res.status(200).json({
      status: "Success: User profile updated!",
      data: { user: updatedUser },
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ status: "Could not update user profile!", err: err.message });
  }
};
