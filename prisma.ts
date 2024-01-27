// Modules
import { PrismaClient, discord_bots, revolt_bots, users } from "@prisma/client";
import getUserData from "./dovewing.js";
const Prisma = new PrismaClient();

// Users
class Users {
	static async create(data: users) {
		try {
			await Prisma.users.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: users) {
		try {
			await Prisma.users.update({
				where: {
					userid: id,
				},
				data: data,
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async get(data: any) {
		const doc = await Prisma.users.findUnique({
			where: data,
			include: {
				discord: true,
				revolt: true,

				discord_comments: false,
				revolt_comments: false,
			},
		});

		const cache = await getUserData(doc.userid);

		if (!doc) return null;
		else {
			doc.discord.map(async (p) => await getUserData(p.botid));

			if (cache === true) return doc;
			else {
				const diff = await Prisma.users.findUnique({
					where: data,
					include: {
						discord: true,
						revolt: true,

						discord_comments: false,
						revolt_comments: false,
					},
				});

				return diff;
			}
		}
	}

	static async find(data: any) {
		const docs = await Prisma.users.findMany({
			where: data,
			include: {
				discord: true,
				revolt: true,

				discord_comments: false,
				revolt_comments: false,
			},
		});

		return docs;
	}

	static async delete(userid: string) {
		try {
			await Prisma.users.delete({
				where: {
					userid: userid,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}
}

// Discord Bots
class Discord {
	static async create(data: discord_bots) {
		try {
			await Prisma.discord_bots.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: discord_bots) {
		try {
			await Prisma.discord_bots.update({
				where: {
					botid: id,
				},
				data: data,
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async get(data: any) {
		const doc = await Prisma.discord_bots.findUnique({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		if (!doc) return null;
		else {
			const cache = await getUserData(doc.botid);
			await getUserData(doc.owner.userid);

			if (cache === true) return doc;
			else {
				const diff = await Prisma.discord_bots.findUnique({
					where: data,
					include: {
						owner: true,
						comments: true,
					},
				});

				return diff;
			}
		}
	}

	static async find(data: any) {
		const docs = await Prisma.discord_bots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		docs.map(async (p) => {
			await getUserData(p.botid);
			await getUserData(p.owner.userid);
		});

		const diff = await Prisma.discord_bots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		return diff;
	}

	static async delete(botid: string) {
		try {
			await Prisma.discord_bots.delete({
				where: {
					botid: botid,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async comment(
		BotID: string,
		UserID: string,
		Caption: string,
		Image: string
	) {
		try {
			await Prisma.discord_comments.create({
				data: {
					botid: BotID,
					commentid: crypto.randomUUID().toString(),
					creatorid: UserID,
					caption: Caption,
					image: Image,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}
}

// Revolt Bots
class Revolt {
	static async create(data: revolt_bots) {
		try {
			await Prisma.revolt_bots.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: revolt_bots) {
		try {
			await Prisma.revolt_bots.update({
				where: {
					botid: id,
				},
				data: data,
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async get(data: any) {
		const doc = await Prisma.revolt_bots.findUnique({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		if (!doc) return null;
		else {
			const cache = await getUserData(doc.botid);
			await getUserData(doc.owner.userid);

			if (cache === true) return doc;
			else {
				const diff = await Prisma.revolt_bots.findUnique({
					where: data,
					include: {
						owner: true,
						comments: true,
					},
				});

				return diff;
			}
		}
	}

	static async find(data: any) {
		const docs = await Prisma.revolt_bots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		docs.map(async (p) => {
			await getUserData(p.botid);
			await getUserData(p.owner.userid);
		});

		const diff = await Prisma.revolt_bots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		return diff;
	}

	static async delete(botid: string) {
		try {
			await Prisma.revolt_bots.delete({
				where: {
					botid: botid,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}

	static async comment(
		BotID: string,
		UserID: string,
		Caption: string,
		Image: string
	) {
		try {
			await Prisma.revolt_comments.create({
				data: {
					botid: BotID,
					commentid: crypto.randomUUID().toString(),
					creatorid: UserID,
					caption: Caption,
					image: Image,
				},
			});

			return true;
		} catch (err) {
			return err;
		}
	}
}

// Export Classes
export { Users, Discord, Revolt, Prisma };
