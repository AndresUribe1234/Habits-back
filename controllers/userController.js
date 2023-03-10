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

exports.updateUserProfile = async (req, res) => {
  try {
    const { email, name, habits } = req.body;

    // 1) Find user to update
    const usertToUpdate = await User.findOne({ email: email });

    //2) User to update and user logged in must be equal
    if (req.user.email !== usertToUpdate.email) {
      throw new Error(
        "User logged in and user requesting update are different!"
      );
    }

    //3)Update user profile
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
