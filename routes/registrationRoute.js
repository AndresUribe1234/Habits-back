const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const registrationController = require(`${__dirname}/../controllers/registrationController`);

router
  .route("/")
  .post(authController.protectRoutes, registrationController.createNewHabit);

module.exports = router;
