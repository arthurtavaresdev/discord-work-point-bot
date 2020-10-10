const path = require("path");
require("dotenv").config();
module.exports = {
	client: "sqlite3",
	connection: {
		filename: path.resolve(__dirname, process.env.SQLITE_FILENAME),
	},
	useNullAsDefault: false,
};
