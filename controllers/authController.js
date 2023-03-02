const User = require(`${__dirname}/../models/userModel`);

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = await User.create({ email, password });

    res.status(200).json({
      status: "Success:User was created!",
      newUser,
    });
  } catch (err) {
    res.status(400).json({ status: "User signup failed!", err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userToLogin = await User.find({ email: email });

    if (
      email === userToLogin[0].email &&
      password === userToLogin[0].password
    ) {
      res.status(200).json({
        status: "Success:User logged in!",
        user: userToLogin[0],
      });
    } else {
      throw new Error();
    }
  } catch (err) {
    res.status(400).json({ status: "User login failed!", err: err.message });
  }
};
