const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const registrationController = require(`${__dirname}/../controllers/registrationController`);
const streakStatsController = require(`${__dirname}/../controllers/streakStatsController`);
const otherController = require(`${__dirname}/../controllers/otherController`);

router
  .route("/single-user/")
  .get(
    authController.protectRoutes,
    registrationController.getAllUserRegistrations
  )
  .post(
    authController.protectRoutes,
    registrationController.createNewHabit,
    streakStatsController.setUserCurrentStreak,
    streakStatsController.setLongestStreak
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
    registrationController.editRegistrationById,
    streakStatsController.setUserCurrentStreak,
    streakStatsController.setLongestStreak
  );

router
  .route("/test")
  .get(authController.protectRoutes, otherController.testMiddleware);

module.exports = router;
