import { Elysia, t } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { cart } from "~/modules/cart";
import { auth } from "~/modules/auth";

const app = new Elysia()
	.group("/api", (app) =>
		app
			.use(
				jwt({
					name: "jwt",
					secret: Bun.env.JWT_SECRET!,
				})
			)
			.use(bearer())
			.use(auth)
			.use(cart)
	)
	.listen(8080);
console.log(`app is running at ${app.server?.hostname}:${app.server?.port}`);
