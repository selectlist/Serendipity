// Modules
import { PrismaClient, discordbots, users } from "@prisma/client";
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
		let doc = await Prisma.users.findUnique({
			where: data,
			include: {
				discordbots: true,
				botcomments: false,
			},
		});

		const cache = await getUserData(doc.userid);
		if (!doc) return null;
		else {
			doc.discordbots.map(async (p) => await getUserData(p.botid));

			if (cache === true) return doc;
			else {
				doc = await Prisma.users.findUnique({
					where: data,
					include: {
						discordbots: true,
						botcomments: false,
					},
				});

				return doc;
			}
		}
	}

	static async find(data: any) {
		let docs = await Prisma.users.findMany({
			where: data,
			include: {
				discordbots: true,
				botcomments: false,
			},
		});

		docs.map(async (p) => {
			await getUserData(p.userid);
			p.discordbots.map(async (i) => await getUserData(i.botid));
		});

		docs = await Prisma.users.findMany({
			where: data,
			include: {
				discordbots: true,
				botcomments: false,
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

// Bots
class Bots {
	static async create(data: discordbots) {
		try {
			await Prisma.discordbots.create({
				data: data,
			});

			return true;
		} catch (error) {
			return error;
		}
	}

	static async update(id: string, data: discordbots) {
		try {
			await Prisma.discordbots.update({
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
		let doc = await Prisma.discordbots.findUnique({
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
				doc = await Prisma.discordbots.findUnique({
					where: data,
					include: {
						owner: true,
						comments: true,
					},
				});

				return doc;
			}
		}
	}

	static async find(data: any) {
		let docs = await Prisma.discordbots.findMany({
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

		docs = await Prisma.discordbots.findMany({
			where: data,
			include: {
				owner: true,
				comments: true,
			},
		});

		return docs;
	}

	static async delete(botid: string) {
		try {
			await Prisma.discordbots.delete({
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
			await Prisma.botcomments.create({
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
export { Users, Bots, Prisma };
