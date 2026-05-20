import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "../_errors/unauthorized-error";

// biome-ignore lint/suspicious/useAwait: required by @fastify
export async function resetPasswordRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/password/reset",
		{
			schema: {
				tags: ["Auth"],
				summary: "/password/reset",
				description: "Reset password by verifying a code",
				body: z.object({
					code: z.string(),
					password: z.string().min(6),
				}),
			},
		},
		async (request, reply) => {
			const { code, password } = request.body;

			const tokenFromCode = await prisma.token.findUnique({
				where: { id: code },
			});

			if (!tokenFromCode) {
				throw new UnauthorizedError(null, AuthException.UNAUTHORIZED);
			}

			const passwordHash = await hash(password, 6);

			await prisma.user.update({
				where: {
					id: tokenFromCode.userId,
				},
				data: {
					passwordHash,
				},
			});

			return reply.status(204).send();
		}
	);
}
