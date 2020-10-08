exports.up = function (knex) {
	return knex.schema.createTable("users", function (table) {
		table.increments();
		table.string("nickname").notNullable();
		table.text("discord_id").unique().notNullable();
		table.timestamps();
	});
};

exports.down = (knex) => knex.schema.dropTable("users");
