require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();
const commands = require("./commands");

const prefix = "!";
client.login(process.env.TOKEN);
client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", (message) => {
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	if (message.content[0] !== prefix) {
		return;
	}

	const userCommand = args.shift().toLowerCase();

	try {
		let command = commands[userCommand];
		if (command) {
			command(message);
		}
	} catch (e) {
		message.channel.sender(
			"Ocorreu algum erro, contate o criador do bot - arthurabreu00@gmail.com"
		);
		console.error(e);
	}
});
