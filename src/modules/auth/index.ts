import { Elysia, t } from "elysia";
import { prisma } from "~/libs/prisma";
import { comparePassword, hashPassword } from "~/utils/bcrypt";

export const auth = (app: Elysia) =>
	app.group("/auth", (app) =>
		app
			.post(
				"/register",
				async ({ body, set }) => {
					const { email, name, password, username } = body;
					const emailExists = await prisma.user.findUnique({
						where: {
							email,
						},
						select: {
							id: true,
						},
					});
					if (emailExists) {
						set.status = 400;
						return {
							success: false,
							data: null,
							message: "Email address already in use.",
						};
					}

					// validate duplicate username
					const usernameExists = await prisma.user.findUnique({
						where: {
							username,
						},
						select: {
							id: true,
						},
					});

					if (usernameExists) {
						set.status = 400;
						return {
							success: false,
							data: null,
							message: "Someone already taken this username.",
						};
					}

					// handle password
					const hash = await hashPassword(password);

					const newUser = await prisma.user.create({
						data: {
							name,
							email,
							password: hash,
							username,
						},
					});

					return {
						success: true,
						message: "Account created",
						data: {
							user: newUser,
						},
					};
				},
				{
					body: t.Object({
						name: t.String(),
						email: t.String(),
						username: t.String(),
						password: t.String(),
					}),
				}
			)
			.post(
				"/login",
				// @ts-ignore
				async ({ body, set, jwt, setCookie }) => {
					const { username, password } = body;
					// verify email/username
					const user = await prisma.user.findFirst({
						where: {
							OR: [
								{
									email: username,
								},
								{
									username,
								},
							],
						},
						select: {
							id: true,
							email: true,
							password: true,
						},
					});

					if (!user) {
						set.status = 400;
						return {
							success: false,
							data: null,
							message: "Invalid credentials",
						};
					}

					// verify password
					const match = await comparePassword(password, user.password);
					if (!match) {
						set.status = 400;
						return {
							success: false,
							data: null,
							message: "Invalid credentials",
						};
					}

					// generate access and refresh token

					const accessToken = await jwt.sign({
						userId: user.id,
					});
					setCookie("access_token", accessToken, {
						maxAge: 86400 * 60, // 7 days
						path: "/",
					});

					return {
						success: true,
						data: accessToken,
						message: "Account login successfully",
					};
				},
				{
					body: t.Object({
						username: t.String(),
						password: t.String(),
					}),
				}
			)
	);
