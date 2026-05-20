import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// biome-ignore lint/suspicious/useAwait: required by @fastify
export async function createAccountRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/users",
		{
			schema: {
				body: z.object({
					name: z.string(),
					email: z.email(),
					password: z.string().min(6),
				}),
			},
		},
		async (request, reply) => {
			const { name, email, password } = request.body;

			const userWithSameEmail = await prisma.user.findUnique({
				where: { email },
			});

			if (userWithSameEmail) {
				return reply
					.status(400)
					.send({ message: "User with same e-mail already registered." });
			}

			const passwordHash = hash(password, 6);

			await prisma.user.create({
				data: {
					name,
					email,
					passwordHash,
				},
			});

			return reply.status(201).send();
		}
	);
}
