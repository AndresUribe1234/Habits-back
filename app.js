const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// App creation
const app = express();
const PORT = 8000;

dotenv.config({ path: `./config.env` });

app.use(cors());

// Connection to DB
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
).replace("<DBNAME>", process.env.DATABASE_NAME);

mongoose.set("strictQuery", false);

mongoose.connect(DB).then((con) => {
  console.log("DB connection successful");
});

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

// Backend routes
const userRouter = require("./routes/usersRoute");

app.use("/api/users", userRouter);

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}`)
);
