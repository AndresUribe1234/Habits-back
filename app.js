const express = require("express");

const app = express();
const PORT = 8000;

const server = app.listen(PORT, () =>
  console.log(`Server running on PORT ${PORT}`)
);
