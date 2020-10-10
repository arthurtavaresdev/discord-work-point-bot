const knex = require("../src/database");

exports.up = function (knex) {
	return knex.schema.createTable("points", function (table) {
		table.increments();
		table.timestamp("entry").nullable();
		table.timestamp("break").nullable();
		table.timestamp("regress").nullable();
		table.timestamp("stop").nullable();
		table.text("user_id");
		table.foreign("user_id").references("users.id");
		table.bigInteger("discord_id");
		table.timestamp("created_at");
		table.timestamp("updated_at");
	});
};

exports.down = (knex) => knex.schema.dropTable("points");
