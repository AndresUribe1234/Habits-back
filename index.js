const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const cron = require("node-cron");
const moment = require("moment");

const scheduleFunctions = require("./util/scheduleFunctions");

// App creation
const app = express();
const PORT = 8000;

dotenv.config({ path: `./config.env` });

app.use(cors({ origin: "*" }));

// Connection to DB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DBNAME>", process.env.DATABASE_NAME);

mongoose.set("strictQuery", false);

mongoose.connect(DB).then((con) => {
  console.log("DB connection successful");
});

// Middleware

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Development
app.use(morgan("dev"));

// Backend routes
const userRouter = require("./routes/usersRoute");
const registrationRouter = require("./routes/registrationRoute");

app.use("/api/users", userRouter);
app.use("/api/registration", registrationRouter);
app.get("/", (req, res) => {
  res.send("Express JS on Vercel for habittus app :)");
});

// Scheduling a simple task with node cron
cron.schedule("0 */30 * * * *", scheduleFunctions.changingStatusEachDay, {
  timezone: "America/Bogota",
});

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}`)
);
