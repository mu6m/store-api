import { Elysia, t } from "elysia";
import { prisma } from "~/libs/prisma";
import { isAuthenticated } from "~/middlewares/auth";

export const cart = (app: Elysia) =>
	app.group("/cart", (app) =>
		app
			.use(isAuthenticated)
			.post(
				"/add",
				async ({ user, body, set }: any) => {
					const { productID, many } = body;
					//check the remianing
					if (many < 0) {
						set.status = 400;
						return {
							success: false,
							message: "Quantity should be positive !",
						};
					}
					const msg = await prisma.$transaction(async (tx) => {
						const product = await prisma.product.findUnique({
							where: {
								id: productID,
							},
							select: {
								remaining: true,
							},
						});

						if (product === null) {
							set.status = 400;
							return {
								success: false,
								message: "Product Not Found",
							};
						}

						// is it unlimited ?
						if (product.remaining < 0) {
							// then add any ammount to cart
							await prisma.cart.create({
								data: {
									productID,
									userID: user.id,
									many,
								},
							});
							return {
								success: true,
								message: "Added",
							};
						}
						//check if already exsits
						const item = await prisma.cart.findUnique({
							where: {
								id: productID,
								userID: user.id,
							},
							select: {
								many: true,
							},
						});
						let has = 0;
						if (item !== null) {
							has += item.many;
						}
						if (many + has <= product.remaining) {
							await prisma.cart.create({
								data: {
									productID,
									userID: user.id,
									many,
								},
							});
						} else {
							set.status = 400;
							return {
								success: false,
								message: "Not Enough Items",
							};
						}

						return {
							success: true,
							message: "Added",
						};
					});
					//added to cart !
					return msg;
				},
				{
					body: t.Object({
						productID: t.String(),
						many: t.Numeric(),
					}),
				}
			)
			.post(
				"/remove",
				async ({ user, body, set }: any) => {
					const { productID, many } = body;
					//check the remianing
					if (many <= 0) {
						return {
							success: false,
							message: "cant be negative",
						};
					}
					const item = await prisma.cart.delete({
						where: {
							userID_productID: {
								userID: user.id,
								productID,
							},
						},
					});
					// if he gives us a big int remove it completly !
					if (many >= item.many) {
						await prisma.cart.delete({
							where: {
								userID_productID: {
									userID: user.id,
									productID,
								},
							},
						});
						return {
							success: true,
							message: "product removed",
						};
					}
					//else decrement

					await prisma.cart.update({
						where: {
							userID_productID: {
								userID: user.id,
								productID,
							},
						},
						data: {
							many: { decrement: many },
						},
					});
					return {
						success: true,
						message: "product decremented",
					};
				},
				{
					body: t.Object({
						productID: t.String(),
						many: t.Numeric(),
					}),
				}
			)
	);
