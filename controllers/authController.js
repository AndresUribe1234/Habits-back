const User = require(`${__dirname}/../models/userModel`);
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

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
    const token = signToken(newUser._id);

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

    if (!userToLogin) throw new Error("Incorrect user or password!");

    const correct = await userToLogin.correctPassword(
      userToLogin.password,
      password
    );

    if (!userToLogin || !correct) {
      throw new Error("Incorrect user or password!");
    }

    // 4)Create jwt
    const token = signToken(userToLogin._id);

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

exports.protectRoutes = async (req, res, next) => {
  try {
    // 1)Get token and check if it exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2)Verification of token
    if (!token) {
      throw new Error("User does not has a token. Please log in!");
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3)Check if user still existes
    const userExist = await User.findById(decoded.id);
    if (!userExist) {
      throw new Error("User no longer exists!");
    }

    // 4)Check if user changed password after the jwt was issued
    if (userExist.changedPasswordAfter(decoded.iat)) {
      throw new Error("Token no longer valid, user changed password!");
    }

    // Access granted to protected route
    req.user = userExist;
    next();
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "Route access denied!", err: err.message });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const { password, newEmail } = req.body;
    const email = req.user.email.trim();

    // 1) Check if email and pasword exist
    if (!email || !password || !newEmail) {
      throw new Error("User did not entered all the required fields!");
    }

    // 2) Check if user exists and password is correct
    const userToChangeEmail = await User.findOne({ email: email }).select(
      "+password"
    );

    if (!userToChangeEmail) throw new Error("Incorrect user or password!");

    const correct = await userToChangeEmail.correctPassword(
      userToChangeEmail.password,
      password
    );

    if (!userToChangeEmail || !correct) {
      throw new Error("Incorrect user or password!");
    }

    // 4)Check if theres another user with the new email requested

    const allUsers = await User.find();
    const arrayOfUsers = allUsers.map((ele) => ele.email);

    if (arrayOfUsers.includes(newEmail)) {
      throw new Error(
        "Theres already another user with the email you are trying to use!"
      );
    }

    // 5)Create validation token and fields in user colection
    const verificationToken = crypto.randomBytes(12).toString("hex");

    // 6)Modify user document
    userToChangeEmail.newEmailRequest = newEmail;
    userToChangeEmail.verificationToken = verificationToken;
    await userToChangeEmail.save();

    // 5)Send verification token to new email
    sgMail.setApiKey(process.env.API_KEY_SENDGRID);

    const message = {
      to: `${newEmail}`,
      from: { name: "Habittus", email: "habittusdev@gmail.com" },
      subject: "New email verification token",
      text: `Hello ${req.user.name},

      We have received a request to update the email address associated with your account at Habittus. To verify your new email address, please enter the following verification token on our app:
      
      Verification Token: ${verificationToken}
      
      Thank you,
      Habittus Team`,
      html: `
      <div>
        <h3>Hello ${req.user.name},</h3>
        <p>We have received a request to update the email address associated with your account at Habittus. To verify your new email address, please enter the following verification token on our app:</p>
        <p>Verification Token: ${verificationToken}</p>
        <p>Thank you,</p>
        <p>Habittus Team,</p>
      </div>
      `,
    };

    await sgMail.send(message);

    // 5)Send okay to client
    res.status(200).json({
      status: "Success:New email verification token sent!",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "New email verification token could not be sent!",
      err: err.message,
    });
  }
};

exports.changeEmailPostToken = async (req, res) => {
  try {
    // 1)Get user email
    const email = req.user.email;

    const token = req.body.verificationToken;

    if (!token) throw new Error("Token was not submitted!");

    // 2) Check if user exists and password is correct
    const userToChangeEmail = await User.findOne({ email: email });

    if (!userToChangeEmail) throw new Error("Incorrect email!");

    // 3)Check if token is correct
    const correct = await userToChangeEmail.correctToken(
      userToChangeEmail.verificationToken,
      token
    );

    // 4) Incorrect token
    if (!correct) {
      throw new Error("Incorrect token!");
    }

    // 5)If token was correct update user information
    const changeToken = crypto.randomBytes(12).toString("hex");

    if (correct) {
      userToChangeEmail.email = userToChangeEmail.newEmailRequest;
      userToChangeEmail.verificationToken = changeToken;
      await userToChangeEmail.save();

      // 5)Send response to client
      res.status(200).json({
        status: "Success:Email was changed!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Verification token is not valid!",
      err: err.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    // 1)Get user email
    const email = req.user.email;

    const { newPassword, currentPassword, confirmCurrentPassword } = req.body;

    if (!newPassword || !currentPassword || !confirmCurrentPassword) {
      throw new Error("Information was not submitted!");
    }

    if (currentPassword !== confirmCurrentPassword) {
      throw new Error(
        "Current password and confirm current password do not match!"
      );
    }

    // 2) Check if user exists and password is correct
    const userToChangePassword = await User.findOne({ email: email }).select(
      "+password"
    );

    if (!userToChangePassword) throw new Error("Use does not exist!");

    // 3)Check if token is correct
    const correct = await userToChangePassword.correctPassword(
      userToChangePassword.password,
      currentPassword
    );

    // 4) Incorrect token
    if (!correct) {
      throw new Error("Incorrect password!");
    }

    // 5)If password was correct update user information

    if (correct) {
      userToChangePassword.password = newPassword;

      await userToChangePassword.save();

      // 5)Send response to client
      res.status(200).json({
        status: "Success:Password was changed!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed: Password coult not be changed!",
      err: err.message,
    });
  }
};
