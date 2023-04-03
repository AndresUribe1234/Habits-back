const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const userController = require(`${__dirname}/../controllers/userController`);

router.route("/").get(authController.protectRoutes, userController.getAllUsers);

router
  .route("/profile/:email")
  .get(authController.protectRoutes, userController.getUserById)
  .post(authController.protectRoutes, userController.updateUserProfile);

router
  .route("/profile/id/:userId")
  .get(authController.protectRoutes, userController.getUserByIdParams);

router.post("/signup", authController.signup);
router.post("/signup/post-token", authController.createAccountPostToken);

router.post("/login", authController.login);

router.get(
  "/get-leaderboards",
  authController.protectRoutes,
  userController.getLeaderboards
);

router.post(
  "/account/change-email",
  authController.protectRoutes,
  authController.changeEmail
);

router.post(
  "/account/validate-token",
  authController.protectRoutes,
  authController.changeEmailPostToken
);

router.patch(
  "/account/change-password",
  authController.protectRoutes,
  authController.changePassword
);

router.post(
  "/account/password-reset/send-token",
  authController.sendEmailTokenPassword
);

router.post(
  "/account/password-reset/new-password",
  authController.changePasswordPostToken
);

module.exports = router;
