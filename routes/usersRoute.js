const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);
const userController = require(`${__dirname}/../controllers/userController`);

router.route("/").get(authController.protectRoutes, userController.getAllUsers);

router.post("/signup", authController.signup);

router.post("/login", authController.login);

module.exports = router;
