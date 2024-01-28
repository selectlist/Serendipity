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
	platform: string,
	userid: string,
	botid: string
): Promise<boolean | Error> => {
	try {
		const webhookClient = new WebhookClient({
			id: process.env.DISCORD_LOG_CHANNEL,
			token: process.env.DISCORD_LOG_CHANNEL_TOKEN,
		});

		let bot = null;
		const staffMember = await database.Users.get({
			userid: userid,
		});

		if (platform === "Discord") {
			bot = await database.Discord.get({
				botid: botid,
			});

			await database.Prisma.discord_audits.create({
				data: {
					botid: botid,
					staffid: userid,
					action: action,
					reason: reason,
				},
			});
		} else if (platform === "Revolt") {
			bot = await database.Revolt.get({
				botid: botid,
			});

			await database.Prisma.revolt_audits.create({
				data: {
					botid: botid,
					staffid: userid,
					action: action,
					reason: reason,
				},
			});
		}

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
							name: "Platform",
							value: platform,
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

// Discord Actions
class Discord {
	static async Claim(
		botid: string,
		userid: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.claim");
		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.discord_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "CLAIMED";
				bot.claimedBy = userid;

				await database.Discord.update(botid, bot);
				await logAction(
					"CLAIMED",
					"Bot claimed.",
					"Discord",
					userid,
					botid
				);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Unclaim(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.unclaim");
		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.discord_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "PENDING";
				bot.claimedBy = null;

				await database.Discord.update(botid, bot);
				await logAction("UNCLAIMED", reason, "Discord", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Approve(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.approve");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.discord_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "APPROVED";
				bot.claimedBy = null;

				await database.Discord.update(botid, bot);
				await logAction("APPROVED", reason, "Discord", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Deny(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.deny");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.discord_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "DENIED";
				bot.claimedBy = null;

				await database.Discord.update(botid, bot);
				await logAction("DENIED", reason, "Discord", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Ban(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.ban");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.discord_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "BANNED";
				bot.claimedBy = null;

				await database.Discord.update(botid, bot);
				await logAction("BANNED", reason, "Discord", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}
}

// Revolt Actions
class Revolt {
	static async Claim(
		botid: string,
		userid: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.claim");
		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "CLAIMED";
				bot.claimedBy = userid;

				await database.Revolt.update(botid, bot);
				await logAction(
					"CLAIMED",
					"Bot claimed.",
					"Revolt",
					userid,
					botid
				);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Unclaim(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.unclaim");
		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "PENDING";
				bot.claimedBy = null;

				await database.Revolt.update(botid, bot);
				await logAction("UNCLAIMED", reason, "Revolt", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Approve(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.approve");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "APPROVED";
				bot.claimedBy = null;

				await database.Revolt.update(botid, bot);
				await logAction("APPROVED", reason, "Revolt", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Deny(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.deny");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "DENIED";
				bot.claimedBy = null;

				await database.Revolt.update(botid, bot);
				await logAction("DENIED", reason, "Revolt", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}

	static async Ban(
		botid: string,
		userid: string,
		reason: string
	): Promise<boolean | Error> {
		const perms = await checkPerms(userid, "bots.ban");

		if (!perms)
			throw new Error(
				"[Permission Denied] => You do not have enough permissions for this action."
			);
		else {
			try {
				let bot = await database.Prisma.revolt_bots.findUnique({
					where: {
						botid: botid,
					},
				});
				bot.state = "BANNED";
				bot.claimedBy = null;

				await database.Revolt.update(botid, bot);
				await logAction("BANNED", reason, "Revolt", userid, botid);

				return true;
			} catch (error) {
				throw new Error(error);
			}
		}
	}
}

export { Discord, Revolt };
