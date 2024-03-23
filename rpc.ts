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

// RPC
const availableEntities: {
	namespace: string;
	actions: {
		name: string;
		description: string;
		params: {
			name: string;
			description: string;
		}[];
		permissionRequired: string;
		execute: (data: any) => Promise<boolean | Error>;
	}[];
}[] = [
	{
		namespace: "bots",
		actions: [
			{
				name: "claim",
				description: "Claim bot.",
				params: [
					{
						name: "bot_id",
						description: "What is the Bot ID?",
					},
					{
						name: "staff_id",
						description: "What is the Staff Member ID?",
					},
					{
						name: "platform",
						description: "Discord or Revolt?",
					},
				],
				permissionRequired: "bots.claim",
				execute: async (data: any) => {
					let bot = await database.Prisma[
						`${data.platform.toLowerCase()}_bots`
					].findUnique({
						where: {
							botid: data.bot_id,
						},
					});
					bot.state = "CLAIMED";
					bot.claimedBy = data.staff_id;

					await database[data.platform].update(data.bot_id, bot);
					await logAction(
						"CLAIMED",
						"Bot claimed.",
						data.platform,
						data.staff_id,
						data.bot_id
					);

					return true;
				},
			},
			{
				name: "unclaim",
				description: "Unclaim bot.",
				params: [
					{
						name: "bot_id",
						description: "What is the Bot ID?",
					},
					{
						name: "staff_id",
						description: "What is the Staff Member ID?",
					},
					{
						name: "platform",
						description: "Discord or Revolt?",
					},
					{
						name: "reason",
						description: "Why are you unclaiming this entity?",
					},
				],
				permissionRequired: "bots.unclaim",
				execute: async (data: any) => {
					let bot = await database.Prisma[
						`${data.platform.toLowerCase()}_bots`
					].findUnique({
						where: {
							botid: data.bot_id,
						},
					});
					bot.state = "PENDING";
					bot.claimedBy = null;

					await database[data.platform].update(data.bot_id, bot);
					await logAction(
						"UNCLAIMED",
						data.reason,
						data.platform,
						data.staff_id,
						data.bot_id
					);

					return true;
				},
			},
			{
				name: "approve",
				description: "Approve bot.",
				params: [
					{
						name: "bot_id",
						description: "What is the Bot ID?",
					},
					{
						name: "staff_id",
						description: "What is the Staff Member ID?",
					},
					{
						name: "platform",
						description: "Discord or Revolt?",
					},
					{
						name: "reason",
						description: "Why are you approving this entity?",
					},
				],
				permissionRequired: "bots.approve",
				execute: async (data: any) => {
					let bot = await database.Prisma[
						`${data.platform.toLowerCase()}_bots`
					].findUnique({
						where: {
							botid: data.bot_id,
						},
					});
					bot.state = "APPROVED";
					bot.claimedBy = null;

					await database[data.platform].update(data.bot_id, bot);
					await logAction(
						"APPROVED",
						data.reason,
						data.platform,
						data.staff_id,
						data.bot_id
					);

					return true;
				},
			},
			{
				name: "deny",
				description: "Deny bot.",
				params: [
					{
						name: "bot_id",
						description: "What is the Bot ID?",
					},
					{
						name: "staff_id",
						description: "What is the Staff Member ID?",
					},
					{
						name: "platform",
						description: "Discord or Revolt?",
					},
					{
						name: "reason",
						description: "Why are you denying this entity?",
					},
				],
				permissionRequired: "bots.deny",
				execute: async (data) => {
					let bot = await database.Prisma[
						`${data.platform.toLowerCase()}_bots`
					].findUnique({
						where: {
							botid: data.bot_id,
						},
					});
					bot.state = "DENIED";
					bot.claimedBy = null;

					await database[data.platform].update(data.bot_id, bot);
					await logAction(
						"DENIED",
						data.reason,
						data.platform,
						data.staff_id,
						data.bot_id
					);

					return true;
				},
			},
			{
				name: "ban",
				description: "Ban bot.",
				params: [
					{
						name: "bot_id",
						description: "What is the Bot ID?",
					},
					{
						name: "staff_id",
						description: "What is the Staff Member ID?",
					},
					{
						name: "platform",
						description: "Discord or Revolt?",
					},
					{
						name: "reason",
						description: "Why are you banning this entity?",
					},
				],
				permissionRequired: "bots.ban",
				execute: async (data) => {
					let bot = await database.Prisma[
						`${data.platform.toLowerCase()}_bots`
					].findUnique({
						where: {
							botid: data.bot_id,
						},
					});
					bot.state = "BANNED";
					bot.claimedBy = null;

					await database[data.platform].update(data.bot_id, bot);
					await logAction(
						"BANNED",
						data.reason,
						data.platform,
						data.staff_id,
						data.bot_id
					);

					return true;
				},
			},
		],
	},
];

const Query = async (action: string, data: any): Promise<boolean | Error> => {
	const entity = availableEntities.find(
		(p) => p.namespace === action.split(".")[0]
	);
	const entityAction = entity.actions.find(
		(p) => p.name === action.split(".")[1]
	);

	if (entityAction) {
		if (checkPerms(data.staff_id, entityAction.permissionRequired)) {
			const ActionParams = entityAction.params.map((p) => p.name);

			if (
				JSON.stringify(Object.keys(data)) ===
				JSON.stringify(ActionParams)
			)
				return await entityAction?.execute(data);
			else return new Error("[RPC Error] => Invalid Parameters.");
		} else
			return new Error(
				"[RPC Error] => You do not have permission to do this action."
			);
	}
};

export { Query, availableEntities };
