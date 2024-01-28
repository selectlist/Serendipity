// Packages
import * as redis from "redis";
import * as database from "./prisma.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { RESTGetAPIUserResult, Snowflake } from "discord-api-types/v9";
import { Client } from "revolt.js";
import * as dotenv from "dotenv";
import { info } from "../logger.js";

// Configure dotenv
dotenv.config();

// Initalize REST
const rest = new REST({
	version: "9",
}).setToken(process.env.DISCORD_TOKEN as string);

// Create a Redis client
const client = redis.createClient({
	url: "redis://localhost:6379/0",
});

client.connect();

// Create a Revolt Chat client
const revoltClient: Client = new Client();
revoltClient.loginBot(process.env.REVOLT_TOKEN);
revoltClient.on("ready", async () => info("Revolt (Dovewing)", "Ready!"));

// Cache Manager
const setCache = async (key: string, value: any): Promise<boolean> => {
	try {
		await client.setEx(key, 24 * 60 * 60, value);
		return true;
	} catch (error) {
		console.error("Error setting cache:", error);
		return false;
	}
};

const getCache = async (key: string): Promise<any> => {
	try {
		return await client.get(key);
	} catch (error) {
		console.error("Error getting cache:", error);
		return null;
	}
};

// Dovewing
const getDiscordUser = async (userid: Snowflake): Promise<boolean> => {
	const cache = await getCache(userid);

	if (cache) return true;
	else {
		const apiUserData = (await rest.get(
			Routes.user(userid)
		)) as RESTGetAPIUserResult;

		if (apiUserData.bot) {
			let botData = await database.Prisma.discord_bots.findUnique({
				where: {
					botid: apiUserData.id,
				},
				include: {
					owner: false,
					comments: false,
				},
			});

			botData.name = apiUserData.username;
			botData.avatar = `https://cdn.discordapp.com/avatars/${userid}/${apiUserData.avatar}.png`;

			await database.Discord.update(userid, botData);
			await setCache(userid, JSON.stringify(botData));

			return false;
		} else {
			let userData = await database.Prisma.users.findUnique({
				where: {
					userid: apiUserData.id,
				},
				include: {
					discord: false,
					discord_comments: false,

					revolt: false,
					revolt_comments: false,
				},
			});

			userData.username = apiUserData.username;
			userData.avatar = `https://cdn.discordapp.com/avatars/${userid}/${apiUserData.avatar}.png`;

			await database.Users.update(userid, userData);
			await setCache(userid, JSON.stringify(userData));

			return false;
		}
	}
};

const getRevoltUser = async (userid: string): Promise<boolean> => {
	const cache = await getCache(userid);

	if (cache) return true;
	else {
		let d = await revoltClient.users.fetch(userid).then(async (p) => {
			if (p.bot) {
				let botData = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: p.id,
					},
					include: {
						owner: false,
						comments: false,
					},
				});

				botData.name = p.username;
				botData.avatar = p.avatarURL;

				await database.Revolt.update(userid, botData);
				await setCache(userid, JSON.stringify(botData));

				return false;
			}
		});

		return d;
	}
};

// Export Function
export { getDiscordUser, getRevoltUser };
