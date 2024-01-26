import { botaction } from "@prisma/client";
import { hasPerm } from "../perms.js";
import { EmbedBuilder, WebhookClient } from "discord.js";
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

		const bot = await database.Bots.get({
			botid: botid,
		});

		const staffMember = await database.Users.get({
			userid: userid,
		});

		const webhookClient = new WebhookClient({
			id: process.env.DISCORD_LOG_CHANNEL,
			token: process.env.DISCORD_LOG_CHANNEL_TOKEN,
		});

		webhookClient.send({
			content: `<@${bot.owner.userid}>`,
			embeds: [
				new EmbedBuilder()
					.setTitle(`Bot ${action.toLowerCase()}`)
					.setColor("Random")
					.setAuthor({
						name: staffMember.username,
						iconURL: staffMember.avatar,
					})
					.setThumbnail(bot.avatar)
					.addFields(
						{
							name: "Bot",
							value: `${bot.name} [${botid}]`,
							inline: true,
						},
						{
							name: "Action",
							value: action.toLowerCase(),
							inline: true,
						},
						{
							name: "Reason",
							value: reason,
							inline: true,
						}
					)
					.setFooter({
						text: `Thank you for using Select List!`,
						iconURL: "https://select-list.xyz/logo.png",
					}),
			],
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
			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: botid,
				},
			});
			bot.state = "CLAIMED";

			await database.Bots.update(botid, bot);

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
			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: botid,
				},
			});
			bot.state = "PENDING";

			await database.Bots.update(botid, bot);

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
			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: botid,
				},
			});
			bot.state = "APPROVED";

			await database.Bots.update(botid, bot);

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
			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: botid,
				},
			});
			bot.state = "DENIED";

			await database.Bots.update(botid, bot);

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
			let bot = await database.Prisma.discordbots.findUnique({
				where: {
					botid: botid,
				},
			});
			bot.state = "BANNED";

			await database.Bots.update(botid, bot);

			await logAction("BANNED", reason, userid, botid);

			return true;
		} catch (error) {
			throw new Error(error);
		}
	}
};

export { Claim, Unclaim, Approve, Deny, Ban };
