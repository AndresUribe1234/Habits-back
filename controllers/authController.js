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

    const allUsers = await User.find();
    const emailArray = allUsers.map((ele) => ele.email);

    // 3)Check if email already exist in existing users
    if (emailArray.includes(email)) {
      throw new Error("User with this email already exist!");
    }

    // 4)Create validation token and fields in user colection
    const verificationToken = crypto.randomBytes(12).toString("hex");

    // 5)Send verification token email
    sgMail.setApiKey(process.env.API_KEY_SENDGRID);

    const message = {
      to: `${email}`,
      from: { name: "Habittus", email: "habittusdev@gmail.com" },
      subject: "Verify your Habittus account",
      text: `
      Thank you for creating an account with Habittus. To ensure the security of your account, we need to verify your email address.

Please use the following verification token to complete your account setup:
      
      Verification Token: ${verificationToken}
      
      Thank you,
      Habittus Team`,
      html: `
      <div>
        <p>Thank you for creating an account with Habittus. To ensure the security of your account, we need to verify your email address.</p>
        <p>Please use the following verification token to complete your account setup:</p>
        <p>Verification Token: ${verificationToken}</p>
        <p>Thank you,</p>
        <p>Habittus Team,</p>
      </div>
      `,
    };

    await sgMail.send(message);
    // console.log(verificationToken);

    // 3)Create user
    const newUser = await User.create({
      temporalEmailBeforeVerification: email,
      password,
      passwordConfirm,
      email: Math.random() + "@gmail.com",
      verificationToken,
    });

    res.status(200).json({
      status: "Success:Account verification token was sent!",
    });
  } catch (err) {
    res.status(400).json({ status: "User signup failed!", err: err.message });
  }
};

exports.createAccountPostToken = async (req, res) => {
  try {
    // 1)Get user email
    const email = req.body.email;

    const token = req.body.verificationToken;

    if (!token) throw new Error("Token was not submitted!");
    if (!email) throw new Error("Email was not submitted!");

    // 2) Check if user exists and password is correct
    const userToVerifyAccount = await User.find({
      temporalEmailBeforeVerification: email,
    }).sort({ userCreationDate: -1 });

    if (!userToVerifyAccount[0]) throw new Error("Incorrect email!");

    const idUser = userToVerifyAccount[0]._id;
    const userToVerify = await User.findById(idUser);

    // 3)Check if token is correct
    const correct = await userToVerify.correctToken(
      userToVerify.verificationToken,
      token
    );

    // 4) Incorrect token
    if (!correct) {
      throw new Error("Incorrect token!");
    }

    // 5)If token was correct update user information
    const changeToken = crypto.randomBytes(12).toString("hex");

    if (correct) {
      userToVerify.email = email;
      userToVerify.verificationToken = changeToken;
      userToVerify.accountVerified = true;
      await userToVerify.save();
    }
    // 4)Create jwt
    const loginToken = signToken(userToVerify._id);

    res.status(200).json({
      status: "Success:Your account was created!",
      token: loginToken,
      data: { user: userToVerify },
    });
  } catch (err) {
    res
      .status(400)
      .json({ status: "User account creation failed!", err: err.message });
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

exports.sendEmailTokenPassword = async (req, res) => {
  try {
    // 1)Get email from body
    const { email } = req.body;

    if (!email) {
      throw new Error("Email was not entered!");
    }

    // 2)See if an account with this email exist
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User with this email does not exist!");
    }

    // 3)Create token
    const passwordResetToken = crypto.randomBytes(12).toString("hex");

    // 4)Send verification token email
    sgMail.setApiKey(process.env.API_KEY_SENDGRID);

    const message = {
      to: `${email}`,
      from: { name: "Habittus", email: "habittusdev@gmail.com" },
      subject: "Password reset Habittus account",
      text: `
      We have received a request to reset the password associated with your account at Habittus.

Please use the following verification token to complete the password reset:
      
      Verification Token: ${passwordResetToken}
      
      Thank you,
      Habittus Team`,
      html: `
      <div>
        <p>We have received a request to reset the password associated with your account at Habittus.</p>
        <p>Please use the following verification token to complete the password reset:</p>
        <p>Verification Token: ${passwordResetToken}</p>
        <p>Thank you,</p>
        <p>Habittus Team,</p>
      </div>
      `,
    };

    await sgMail.send(message);
    // console.log(passwordResetToken);

    // 6)Attach token
    user.verificationToken = passwordResetToken;
    await user.save();

    // 5)Send okay to client
    res.status(200).json({
      status: "Success: Password verification token sent!",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed: Password verification token could not be sent!",
      err: err.message,
    });
  }
};

exports.changePasswordPostToken = async (req, res) => {
  try {
    // 1)Get user email
    const { email, verificationToken, newPassword, confirmNewPassword } =
      req.body;

    if (!verificationToken) throw new Error("Token was not submitted!");
    if (!email) throw new Error("Email was not submitted!");
    if (!newPassword) throw new Error("New password was not submitted!");
    if (!confirmNewPassword)
      throw new Error("Confirm new password was not submitted!");

    // 2) Check if user exists and password is correct
    const userToChangePassword = await User.findOne({ email: email });

    if (!userToChangePassword) throw new Error("User does not exist!");

    // 3)Check if token is correct
    const correct = await userToChangePassword.correctToken(
      userToChangePassword.verificationToken,
      verificationToken
    );

    // 4) Incorrect token
    if (!correct) {
      throw new Error("Incorrect token!");
    }

    // 5)Passwords do not match
    if (newPassword !== confirmNewPassword) {
      throw new Error("Passwords entered do not match!");
    }

    // 5)If token was correct update user information
    const changeToken = crypto.randomBytes(12).toString("hex");

    if (correct) {
      userToChangePassword.password = newPassword;
      userToChangePassword.verificationToken = changeToken;
      await userToChangePassword.save();

      // 5)Send response to client
      res.status(200).json({
        status: "Success: Password was changed!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed: Password could not be changed!",
      err: err.message,
    });
  }
};
