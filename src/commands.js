const { Message } = require("discord.js");
const knex = require("./database");
const moment = require("moment");
const Discord = require("discord.js");

/** Comandos Gerais */
module.exports = {
	/** @param {Message} message */
	test: async (message) => {
		let table = await fillTable();
		message.channel.send(table);
	},
	/** @param {Message} message */
	addstaff: async (message) => {
		const permissions = message.member.permissions.has("MANAGE_ROLES");
		if (!permissions) {
			message.reply("❌ Você não tem permissão para essa ação ");
			return;
		}

		const messageUser = message.mentions.users.first();
		if (messageUser === undefined) {
			message.reply(
				"❌ É necessário informar um usúario juntamente ao comando: Exemplo: !addstaff @Nome do contemplado"
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
				message.channel.send("✅ Usuário cadastrado com sucesso!");
			} else {
				message.channel.send("❌ Usuário já cadastrado!");
				return;
			}
		} catch (e) {
			console.error(e);
			message.channel.send(
				"❌ Ocorreu um erro ao adicionar o membro a Staff: " + e.message
			);
		}
	},
	/**
	 * @param {Message} message
	 */
	remover: async (message) => {
		console.log("foda0se");
		const permissions = message.member.permissions.has("MANAGE_ROLES");
		if (!permissions) {
			message.reply("❌ Você não tem permissão para essa ação ");
			return;
		}

		const messageUser = message.mentions.users.first();
		if (messageUser === undefined) {
			message.reply(
				"❌ É necessário marcar o úsuario juntamente ao comando: Exemplo: !remover @Nome do contemplado"
			);
			return;
		}

		const id = messageUser.id;
		try {
			const user = await findUser(id);
			if (user) {
				await knex("users").where("id", user.id).del();
				message.channel.send("✅ Removido da Staff com Sucesso!");
			} else {
				message.channel.send("❌ Usuario não faz parte da Staff!");
			}
		} catch (e) {
			console.error(e);
			message.channel.send(
				"❌ Ocorreu um erro ao remover o membro a Staff: " + e.message
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
				message.channel.send("❌ Usuario não autorizado!");
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

				// !iniciar > Ajudante Makense iniciou o atendimento as 01:53 no dia 10/10/2020
				console.log(message.member.roles);
				message.reply("✅ Ponto batido com sucesso!");
			} else {
				message.reply(
					"❌ seu ponto de ENTRADA já foi registrado hoje!"
				);
			}
		} catch (e) {
			console.error(e);
			message.reply(
				`❌ Ocorreu um erro ao registrar o ponto de ${pointType.title}: ` +
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
	finalizar: async (message) => {
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
	/**
	 * @param {Message} message
	 */
	espelho: async (message, args) => {
		try {
			const messageUser = message.mentions.users.first();
			if (messageUser === undefined) {
				message.reply(
					"❌ É necessário marcar o úsuario e mes/ano juntamente ao comando: Exemplo: !espelho 01/2020 @Nome do buscado "
				);
				return;
			}

			if (!args[0]) {
				message.reply(
					"❌ Comando digitado incorretamente! É necessário marcar o úsuario e mes/ano juntamente ao comando: Exemplo: !espelho 01/2020 @Nome do buscado"
				);
				return;
			}

			let date = moment("01/" + args[0], "DD/MM/YYYY");
			if (!date.isValid()) {
				message.reply(
					"❌ Data invalida. É necessário marcar o úsuario e data juntamente ao comando: Exemplo: !espelho 01/2020 @Nome do buscado"
				);
				return;
			}

			let firstDayOfMonth = date
				.startOf("month")
				.format("YYYY-MM-DD HH:mm:ss");
			let lastDayOfMonth = date
				.endOf("month")
				.format("YYYY-MM-DD HH:mm:ss");

			const user = await findUser(messageUser.id);
			const points = await knex("points")
				.where("user_id", user.id)
				.whereBetween("created_at", [firstDayOfMonth, lastDayOfMonth])
				.orderBy("id", "desc");
			let nickname = message.guild.member(messageUser).displayName;

			const table = await fillTable(points, nickname, args[0]);
			message.channel.send(table);
		} catch (e) {
			console.error(e);
			message.reply(
				`❌ Ocorreu um erro ao gerar o espelho de ponto: ${e.message}`
			);
		}
	},
};

/**
 *
 * @param {Message} message
 * @param {object} pointType
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
				`❌ Você precisa bater seu ponto de ${pointType.dependent.title.toUpperCase()}, antes de prosseguir!`
			);
			return;
		}

		if (point[pointType.code]) {
			message.reply(
				`❌ seu ponto de ${pointType.title.toUpperCase()} já foi registrado hoje!`
			);
			return;
		}

		let updateObject = {
			updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
		};
		updateObject[pointType.code] = moment().format("YYYY-MM-DD HH:mm:ss");

		await knex("points").where("id", point.id).update(updateObject);

		message.reply("✅ Ponto batido com sucesso!");
	} catch (e) {
		console.error(e);
		message.reply(
			`❌ Ocorreu um erro ao registrar o ponto de ${pointType.title}: ` +
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

async function fillTable(data, name, monthYear) {
	let table = `\`\`\`

	              Ponto de @${name} - Mês ${monthYear}                              
	+----------------+----------------+----------------+----------------+
	|     Entrada    |      Pausa     |     Retorno    |      Saída     |
	+----------------+----------------+----------------+----------------+`;
	let sumWorkedMinutes = 0;
	data.forEach((point) => {
		const entry = formatDate(point.entry);
		const breakCoffee = formatDate(point.break);
		const regress = formatDate(point.regress);
		const stop = formatDate(point.stop);
		sumWorkedMinutes += totalDuration(entry, breakCoffee, regress, stop);

		table += `
	| ${entry} | ${breakCoffee} | ${regress} | ${stop} |
	+----------------+----------------+----------------+----------------+`;
	});
	timeWorkedMonthly = moment.duration(sumWorkedMinutes, "seconds");

	table += `
	Horas trabalhadas no período: ${
		timeWorkedMonthly.hours() ? timeWorkedMonthly.hours() : 0
	} horas ${
		timeWorkedMonthly.minutes() ? timeWorkedMonthly.minutes() : 0
	} minutos e ${
		timeWorkedMonthly.seconds() ? timeWorkedMonthly.seconds() : 0
	} segundos .
	\`\`\``;

	return table;
}

const formatDate = (date) => {
	const formattedDated = moment(date, "YYYY-MM-DD HH:mm:ss");
	if (formattedDated.isValid()) {
		return formattedDated.format("DD/MM/YY HH:mm");
	} else {
		return `    Falta.    `;
	}
};

function totalDuration(entry, breakCoffee, regress, stop) {
	try {
		let start = moment(entry, "HH:mm");
		let end = moment(breakCoffee, "HH:mm");

		// difference between start and end time
		let diff = moment.duration(end.diff(start));

		start = moment(regress, "HH:mm");
		end = moment(stop, "HH:mm");
		// obtain difference between the new start and end time and add to the previous value
		diff.add(moment.duration(end.diff(start)));
		if (diff.asMinutes() > 0) {
			return diff.asSeconds();
		} else {
			return 0;
		}
	} catch (e) {
		return 0;
	}
}
