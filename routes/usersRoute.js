const express = require("express");
const router = express.Router();

const authController = require(`${__dirname}/../controllers/authController`);

router.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: "You hit the /users route from the habitus backend" });
});

router.post("/signup", authController.signup);

router.post("/login", authController.login);

module.exports = router;
