const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const userController = require(`${__dirname}/../controllers/userController`);

router.route("/").get(authController.protectRoutes, userController.getAllUsers);

router
  .route("/profile/:email")
  .get(authController.protectRoutes, userController.getUserById)
  .post(authController.protectRoutes, userController.updateUserProfile);

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.post("/passreset", authController.passwordReset);

module.exports = router;
