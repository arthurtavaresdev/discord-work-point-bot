const knex = require("../src/database");

exports.up = function (knex) {
	return knex.schema.createTable("points", function (table) {
		table.increments();
		table.boolean("entry").defaultTo(false);
		table.boolean("break").defaultTo(false);
		table.boolean("regress").defaultTo(false);
		table.boolean("stop").defaultTo(false);
		table.text("user_id");
		table.foreign("user_id").references("users.id");
		table.text("discord_id");
		table.timestamps();
	});
};

exports.down = (knex) => knex.schema.dropTable("points");
