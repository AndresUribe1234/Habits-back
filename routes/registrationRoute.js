const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const registrationController = require(`${__dirname}/../controllers/registrationController`);

router
  .route("/single-user/")
  .get(
    authController.protectRoutes,
    registrationController.getAllUserRegistrations
  )
  .post(authController.protectRoutes, registrationController.createNewHabit);

router
  .route("/")
  .get(
    authController.protectRoutes,
    registrationController.getAllAppRegistrations
  );

module.exports = router;
