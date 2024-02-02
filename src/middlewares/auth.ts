import { Elysia } from "elysia";
import { prisma } from "~/libs/prisma";

export const isAuthenticated = (app: Elysia) =>
	app.derive(async ({ bearer, jwt, set }: any) => {
		if (!bearer) {
			set.status = 401;
			return "Unauthorized";
		}
		const { userId } = await jwt.verify(bearer);
		if (!userId) {
			set.status = 401;
			return {
				success: false,
				message: "Unauthorized",
			};
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});
		if (!user) {
			set.status = 401;
			return {
				success: false,
				message: "Unauthorized",
			};
		}
		return {
			user,
		};
	});
