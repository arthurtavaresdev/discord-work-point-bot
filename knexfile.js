const path = require("path");
require("dotenv").config();
module.exports = {
  client: "sqlite3",
  connection: {
    filename: path.resolve(
      __dirname,
      "src",
      "database",
      process.env.SQLITE_FILENAME
    ),
  },
};
