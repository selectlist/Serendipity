// Packages
import * as redis from "redis";
import * as database from "./prisma.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import type { RESTGetAPIUserResult, Snowflake } from "discord-api-types/v9";
import * as dotenv from "dotenv";

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
const getUserData = async (userid: Snowflake): Promise<boolean> => {
	const cache = await getCache(userid);

	if (cache) return true;
	else {
		const apiUserData = (await rest.get(
			Routes.user(userid)
		)) as RESTGetAPIUserResult;

		if (apiUserData.bot) {
			let botData = await database.Prisma.discordbots.findUnique({
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

			await database.Bots.update(userid, botData);
			await setCache(userid, JSON.stringify(apiUserData));

			return false;
		} else {
			let userData = await database.Prisma.users.findUnique({
				where: {
					userid: apiUserData.id,
				},
				include: {
					discordbots: false,
					botcomments: false,
				},
			});

			userData.username = apiUserData.username;
			userData.avatar = `https://cdn.discordapp.com/avatars/${userid}/${apiUserData.avatar}.png`;

			await database.Users.update(userid, userData);
			await setCache(userid, JSON.stringify(apiUserData));

			return false;
		}
	}
};

// Export Function
export default getUserData;
