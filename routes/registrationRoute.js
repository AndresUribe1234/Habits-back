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
  .post(authController.protectRoutes, registrationController.createNewHabit)
  .patch(
    authController.protectRoutes,
    registrationController.editRegistrationById
  );

router
  .route("/")
  .get(
    authController.protectRoutes,
    registrationController.getAllAppRegistrations
  );

router
  .route("/entry/:id")
  .get(authController.protectRoutes, registrationController.getRegistrationById)
  .patch(
    authController.protectRoutes,
    registrationController.editRegistrationById
  );

module.exports = router;
