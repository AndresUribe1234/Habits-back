const Registration = require("../models/habitsRegistrationModel");

exports.testMiddleware = async (req, res) => {
  try {
    const { user } = req;
    await Registration.deleteMany({ user: user._id });

    res.status(200).json({
      status: "Success:Test working!",
    });
  } catch (err) {
    res.status(400).json({
      status: "Test middleware not working!",
      err: err.message,
    });
  }
};
