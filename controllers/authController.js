const User = require(`${__dirname}/../models/userModel`);
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { email, password, passwordConfirm } = req.body;

    // 1) Check if email and pasword exist
    if (!email || !password || !passwordConfirm) {
      throw new Error("User did not entered all the required fields!");
    }

    // 2)Check if both passwords are equal
    if (password !== passwordConfirm) {
      throw new Error(
        "Password and password confirm entered need to be the same!"
      );
    }

    // 3)Create user
    const newUser = await User.create({ email, password, passwordConfirm });

    // 4)Create jwt
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: "Success:User was created!",
      token,
      data: { user: newUser },
    });
  } catch (err) {
    res.status(400).json({ status: "User signup failed!", err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1) Check if email and pasword exist
    if (!email || !password) {
      throw new Error("User did not entered all the required fields!");
    }

    // 2) Check if user exists and password is correct
    const userToLogin = await User.findOne({ email: email }).select(
      "+password"
    );

    const correct = await userToLogin.correctPassword(
      userToLogin.password,
      password
    );

    console.log("correct", correct);
    console.log(userToLogin);

    if (!userToLogin || !correct) {
      throw new Error("Incorrect user or password!");
    }

    // 4)Create jwt
    const token = jwt.sign({ id: userToLogin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // 5)Send okay to client
    res.status(200).json({
      status: "Success:User logged in!",
      token,
      data: { user: userToLogin },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "User login failed!", err: err.message });
  }
};
