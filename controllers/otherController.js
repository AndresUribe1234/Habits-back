const Registration = require("../models/habitsRegistrationModel");
const fs = require("fs");

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

// exports.findTest = async (req, res) => {
//   try {
//     const allRegistrations = await Registration.find();
//     console.log("Number of registrations:", allRegistrations.length);
//     let fileContents = fs.readFileSync(
//       `${__dirname}/../old-data/andresJSON-2023.txt`,
//       "utf-8"
//     );
//     fileContents = JSON.parse(fileContents);

//     console.log(fileContents);
//     console.log(fileContents.length);

//     const createNewRegistrations = await Registration.create(fileContents);

//     res.status(200).json({
//       status: "Success:Test find working!",
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "Test middleware not working!",
//       err: err.message,
//     });
//   }
// };
