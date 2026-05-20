import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "../_errors/not-found-error";

// biome-ignore lint/suspicious/useAwait: required by @fastify
export async function getProfileRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/user/profile",
			{
				schema: {
					tags: ["User"],
					summary: "Get authenticated user profile",
					response: {
						200: z.object({
							user: z.object({
								id: z.uuid(),
								name: z.string().nullable(),
								email: z.string(),
								avatarUrl: z.string().nullable(),
							}),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();

				const user = await prisma.user.findUnique({
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
					},
					where: {
						id: userId,
					},
				});

				if (!user) {
					throw new NotFoundError("User not found.");
				}

				return reply.status(200).send({ user });
			}
		);
}
