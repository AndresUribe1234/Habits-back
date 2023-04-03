const Registration = require("../models/habitsRegistrationModel");

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
