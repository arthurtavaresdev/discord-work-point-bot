const { Message } = require("discord.js");
const knex = require("./database");
const moment = require("moment");

/** Comandos Gerais */
module.exports = {
	/** @param {Message} message */
	test: (message) => {
		const helpMessage = `Hello World`;
		message.reply(helpMessage);
	},
	/** @param {Message} message */
	addstaff: async (message) => {
		const messageUser = message.mentions.users.first();
		if (messageUser === undefined) {
			message.reply(
				"É necessário informar um usúario juntamente ao comando: Exemplo: !addstaff @Nome do contemplado"
			);
			return;
		}

		const id = messageUser.id;
		try {
			const user = await findUser(id);
			if (user === undefined) {
				await knex("users").insert({
					nickname: messageUser.username,
					discord_id: id,
					created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
				});
				message.channel.send("Usuário cadastrado com sucesso!");
			} else {
				message.channel.send("Usuário já cadastrado!");
				return;
			}
		} catch (e) {
			console.error(e);
			message.channel.send(
				"Ocorreu um erro ao adicionar o membro a Staff: " + e.message
			);
		}
	},
	/**
	 * @param {Message} message
	 */
	removeStaff: async (message) => {
		const messageUser = message.mentions.users.first();
		if (messageUser === undefined) {
			message.reply(
				"É necessário informar um usúario juntamente ao comando: Exemplo: !addstaff @Nome do contemplado"
			);
			return;
		}

		const id = messageUser.id;
		try {
			const user = await findUser(id);
			if (user) {
				await knex("users").where("id", user.id).del();
			} else {
				message.channel.send("Usuario não faz parte da Staff!");
			}
		} catch (e) {
			console.error(e);
			message.channel.send(
				"Ocorreu um erro ao remover o membro a Staff: " + e.message
			);
		}
	},
	/**
	 * @param {Message} message
	 */
	iniciar: async (message) => {
		try {
			const id = message.member.user.id;
			const user = await findUser(id);
			if (!user) {
				message.channel.send("Usuario não autorizado!");
			}

			const yesterday = moment()
				.subtract(16, "hours")
				.format('"YYYY-MM-DD HH:mm:ss"');
			const tomorrow = moment()
				.add(16, "hours")
				.format("YYYY-MM-DD HH:mm:ss");

			const point = await knex("points")
				.where("user_id", user.id)
				.whereBetween("created_at", [yesterday, tomorrow])
				.orderBy("id", "desc")
				.first();

			if (point === undefined || (point && !point.entry)) {
				await knex("points").insert({
					user_id: user.id,
					discord_id: id,
					created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					entry: 1,
				});
				message.reply("Ponto registrado com Sucesso!");
			} else {
				message.reply("seu ponto de ENTRADA já foi registrado hoje!");
			}
		} catch (e) {
			console.error(e);
			message.reply("Ocorreu um erro ao registrar o ponto: " + e.message);
		}
	},
};

async function findUser(discord_id) {
	return await knex("users").where("discord_id", discord_id).first();
}
