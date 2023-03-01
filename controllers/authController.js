const User = require(`${__dirname}/../models/userModel`);

exports.signup = async (req, res) => {
  try {
    const { name, password, habits } = req.body;
    console.log(name, password, habits);
    const newUser = await User.create({ name, password, habits });

    res.status(200).json({
      status: "You hit the /signup route from the habitus backend",
      newUser,
    });
  } catch (err) {
    res.status(200).json({ status: "User signup failed!", err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    res.status(200).json({
      status: "You hit the /login route from the habitus backend",
    });
  } catch (err) {
    res.status(200).json({ status: "User login failed!", err: err.message });
  }
};
