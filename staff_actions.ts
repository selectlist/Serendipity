import { botaction } from "@prisma/client";
import { hasPerm } from "../perms.js";
import { WebhookClient } from "discord.js";
import * as database from "./prisma.js";

const checkPerms = async (userid: string, perm: string) => {
	const user = await database.Users.get({
		userid: userid,
	});

	if (!user) return false;
	else return hasPerm(user?.staff_perms, perm);
};

const logAction = async (
	action: botaction,
	reason: string,
	userid: string,
	botid: string
): Promise<boolean | Error> => {
	try {
		await database.Prisma.botaudits.create({
			data: {
				botid: botid,
				staffid: userid,
				action: action,
				reason: reason,
			},
		});

		const webhookClient = new WebhookClient({
			id: process.env.DISCORD_LOG_CHANNEL,
			token: process.env.DISCORD_LOG_CHANNEL_TOKEN,
		});

		webhookClient.send({
			content: `<@${userid}> has ${action.toLowerCase()} <@${botid}>.\n\nReason: ${reason}`,
		});

		return true;
	} catch (error) {
		throw new Error(error);
	}
};

const Claim = async (
	botid: string,
	userid: string
): Promise<boolean | Error> => {
	const perms = await checkPerms(userid, "bots.claim");
	if (!perms)
		throw new Error(
			"[Permission Denied] => You do not have enough permissions for this action."
		);
	else {
		try {
			await database.Bots.update(botid, {
				state: "CLAIMED",
			});

			await logAction("CLAIMED", "Bot claimed.", userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

const Unclaim = async (
	botid: string,
	userid: string,
	reason: string
): Promise<boolean | Error> => {
	const perms = await checkPerms(userid, "bots.unclaim");
	if (!perms)
		throw new Error(
			"[Permission Denied] => You do not have enough permissions for this action."
		);
	else {
		try {
			await database.Bots.update(botid, {
				state: "PENDING",
			});

			await logAction("UNCLAIMED", reason, userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

const Approve = async (
	botid: string,
	userid: string,
	reason: string
): Promise<boolean | Error> => {
	const perms = await checkPerms(userid, "bots.approve");

	if (!perms)
		throw new Error(
			"[Permission Denied] => You do not have enough permissions for this action."
		);
	else {
		try {
			await database.Bots.update(botid, {
				state: "APPROVED",
			});

			await logAction("APPROVED", reason, userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

const Deny = async (
	botid: string,
	userid: string,
	reason: string
): Promise<boolean | Error> => {
	const perms = await checkPerms(userid, "bots.deny");

	if (!perms)
		throw new Error(
			"[Permission Denied] => You do not have enough permissions for this action."
		);
	else {
		try {
			await database.Bots.update(botid, {
				state: "DENIED",
			});

			await logAction("DENIED", reason, userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

const Ban = async (
	botid: string,
	userid: string,
	reason: string
): Promise<boolean | Error> => {
	const perms = await checkPerms(userid, "bots.ban");

	if (!perms)
		throw new Error(
			"[Permission Denied] => You do not have enough permissions for this action."
		);
	else {
		try {
			await database.Bots.update(botid, {
				state: "BANNED",
			});

			await logAction("BANNED", reason, userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

export { Claim, Unclaim, Approve, Deny, Ban };
