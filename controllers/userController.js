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

    // 3)Check if theres a registration for the current day that needs to be updated
    const nowDateColTz = moment.utc().tz("America/Bogota").format("YYYY-MM-DD");
    const convertedDateForMongoUTC = new Date(nowDateColTz);

    const currentRegistration = await Registration.findOne({
      user: req.user._id,
      registrationFinalDate: convertedDateForMongoUTC,
    });

    // 4)Update habits for registration of the day

    if (currentRegistration) {
      const newAchievedHabits =
        currentRegistration.userHabitsAchievedDayRegistration.filter((ele) =>
          habits.includes(ele)
        );
      currentRegistration.userHabitsAchievedDayRegistration = newAchievedHabits;
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

exports.getLeaderboards = async (req, res) => {
  try {
    // 1) Get current user
    const { user } = req;

    // 2)Get top 10 users with highest current streaks
    const currentTop10 = await User.find()
      .sort({ currentStreak: -1, longestStreak: -1 })
      .limit(5);

    // 3)Get top 10 users with highest longest streaks
    const longestTop10 = await User.find()
      .sort({ longestStreak: -1, currentStreak: -1 })
      .limit(5);

    // 4)Get own ranking

    // 5)Get number of users of the app

    // 6)Send response to client

    res.status(200).json({
      status: "Success: Leaderboards fetched!",
      data: {
        user: user,
        currentStreakTop10: currentTop10,
        longestStreakTop10: longestTop10,
      },
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ status: "Could not fetch leaderboards!", err: err.message });
  }
};
