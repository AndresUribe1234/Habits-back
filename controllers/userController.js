const Registration = require("../models/habitsRegistrationModel");
const moment = require("moment");
const tz = require("moment-timezone");
const User = require(`${__dirname}/../models/userModel`);
const sgMail = require("@sendgrid/mail");

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
    if (usertToUpdate) {
      usertToUpdate.name = name;
      usertToUpdate.habits = habits;
      await usertToUpdate.save();
    }

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
      data: { user: usertToUpdate },
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
    const currentLeaderboards = await User.find()
      .sort({ currentStreak: -1, longestStreak: -1 })
      .exec();

    const currentModified = currentLeaderboards.map((ele, index) => {
      const object = { ...ele.toObject() };
      object.ranking = index + 1;

      const dateFormatBeg = moment
        .utc(ele.dateBeginningCurrentStreak)
        .format("MMM DD, YYYY");

      const dateFormatEnd = moment
        .utc(ele.dateEndCurrentStreak)
        .format("MMM DD, YYYY");

      object.streakBegString = dateFormatBeg;
      object.streakEndString = dateFormatEnd;

      return object;
    });

    // 3)Get top 10 users with highest longest streaks
    const longesLeaderboards = await User.find().sort({
      longestStreak: -1,
      currentStreak: -1,
    });

    const longestModified = longesLeaderboards.map((ele, index) => {
      const object = { ...ele.toObject() };
      object.ranking = index + 1;
      const dateFormatBeg = moment
        .utc(ele.dateBeginningLongestStreak)
        .format("MMM DD, YYYY");

      const dateFormatEnd = moment
        .utc(ele.dateEndLongestStreak)
        .format("MMM DD, YYYY");

      object.streakBegString = dateFormatBeg;
      object.streakEndString = dateFormatEnd;

      return object;
    });

    // 4)Get own ranking in current streak
    const arrayOfIdsCurrent = currentLeaderboards.map((ele) =>
      ele._id.toString()
    );

    const rankingCurrent = arrayOfIdsCurrent.indexOf(user._id.toString()) + 1;

    // 5)Get own ranking in longest streak

    const arrayOfIdsLongest = longesLeaderboards.map((ele) =>
      ele._id.toString()
    );
    const rankingLongest = arrayOfIdsLongest.indexOf(user._id.toString()) + 1;

    // 6)Get number of users of the app
    const numUsersApp = currentLeaderboards.length;

    // 7)Get current with correct format of date
    const currentUser = { ...user.toObject() };

    currentUser.longestStreakBegString = moment
      .utc(currentUser.dateBeginningLongestStreak)
      .format("MMM DD, YYYY");
    currentUser.longestStreakEndString = moment
      .utc(currentUser.dateEndLongestStreak)
      .format("MMM DD, YYYY");
    currentUser.currentStreakBegString = moment
      .utc(currentUser.dateBeginningCurrentStreak)
      .format("MMM DD, YYYY");
    currentUser.currenttStreakEndString = moment
      .utc(currentUser.dateEndCurrentStreak)
      .format("MMM DD, YYYY");

    // 7)Send response to client

    res.status(200).json({
      status: "Success: Leaderboards fetched!",
      data: {
        user: currentUser,
        rankigCurrent: rankingCurrent,
        rankigLongest: rankingLongest,
        numUsers: numUsersApp,
        currentStreakTop10: currentModified.slice(0, 5),
        longestStreakTop10: longestModified.slice(0, 5),
      },
    });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ status: "Could not fetch leaderboards!", err: err.message });
  }
};

exports.getUserByIdParams = async (req, res) => {
  try {
    // 1) Get unique identifier of user
    const { userId } = req.params;

    // 2)Check if user exist
    const userRequested = await User.findById(userId);
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
