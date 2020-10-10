const { Message } = require("discord.js");
const knex = require("./database");
const moment = require("moment");
const { as, update } = require("./database");

/** Comandos Gerais */
module.exports = {
	/** @param {Message} message */
	test: (message) => {
		console.log(valeGrana);

		const helpMessage = `Hello World`;
		message.reply(helpMessage);
	},
	/** @param {Message} message */
	addstaff: async (message) => {
		const permissions = message.member.permissions.has("MANAGE_ROLES");
		if (!permissions) {
			message.reply("Ta maluco ? Tu nem tem permissão pra essa porra");
			return;
		}

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
				"É necessário marcar o úsuario juntamente ao comando: Exemplo: !addstaff @Nome do contemplado"
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

			let point = await findPoint(user);

			if (
				point === undefined ||
				(point && !point.entry) ||
				(point && point.stop)
			) {
				await knex("points").insert({
					user_id: user.id,
					discord_id: id,
					entry: moment().format("YYYY-MM-DD HH:mm:ss"),
					created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
				});
				message.reply("Ponto batido com sucesso!");
			} else {
				message.reply("seu ponto de ENTRADA já foi registrado hoje!");
			}
		} catch (e) {
			console.error(e);
			message.reply(
				`Ocorreu um erro ao registrar o ponto de ${pointType.title}: ` +
					e.message
			);
		}
	},
	/**
	 * @param {Message} message
	 */
	pausa: async (message) => {
		let pointType = {
			title: "Pausa",
			code: "break",
			dependent: {
				title: "Entrada",
				code: "entry",
			},
		};
		await registerPoint(message, pointType);
	},
	/**
	 * @param {Message} message
	 */
	retorno: async (message) => {
		let pointType = {
			title: "Retorno",
			code: "regress",
			dependent: {
				title: "Pausa",
				code: "break",
			},
		};
		await registerPoint(message, pointType);
	},
	/**
	 * @param {Message} message
	 */
	saida: async (message) => {
		let pointType = {
			title: "Saída",
			code: "stop",
			dependent: {
				title: "Retorno",
				code: "regress",
			},
		};
		await registerPoint(message, pointType);
	},
};

/**
 *
 * @param {Message} message
 */
async function registerPoint(message, pointType) {
	try {
		const id = message.member.user.id;
		const user = await findUser(id);

		if (!user) {
			message.channel.send("Usuario não autorizado!");
		}

		let point = await findPoint(user, pointType.dependent.code);
		if (point === undefined || (point && !pointType.dependent.code)) {
			message.reply(
				`Você precisa bater seu ponto de ${pointType.dependent.title.toUpperCase()}, antes de prosseguir!`
			);
			return;
		}

		if (point[pointType.code]) {
			message.reply(
				`seu ponto de ${pointType.title.toUpperCase()} já foi registrado hoje!`
			);
			return;
		}

		let updateObject = {
			updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
		};
		updateObject[pointType.code] = moment().format("YYYY-MM-DD HH:mm:ss");

		await knex("points").where("id", point.id).update(updateObject);

		message.reply("Ponto batido com sucesso!");
	} catch (e) {
		console.error(e);
		message.reply(
			`Ocorreu um erro ao registrar o ponto de ${pointType.title}: ` +
				e.message
		);
	}
}

async function findPoint(user, field = "created_at") {
	const yesterday = moment()
		.subtract(16, "hours")
		.format('"YYYY-MM-DD HH:mm:ss"');
	const tomorrow = moment().add(16, "hours").format("YYYY-MM-DD HH:mm:ss");

	const point = await knex("points")
		.where("user_id", user.id)
		.whereBetween(field, [yesterday, tomorrow])
		.orderBy("id", "desc")
		.first();

	return point;
}

async function findUser(discord_id) {
	return await knex("users").where("discord_id", discord_id).first();
}
