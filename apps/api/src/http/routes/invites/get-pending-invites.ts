/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BusinessException } from "@/http/_errors/exceptions/business/business";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getPendingInvitesRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/invites/pending",
			{
				schema: {
					tags: ["Invites"],
					summary: "/invites/pending",
					description: "Get all pending invites for the authenticated user",
					response: {
						200: z.object({
							invites: z.array(
								z.object({
									id: z.uuid(),
									role: roleSchema,
									email: z.email(),
									createdAt: z.date(),
									organization: z.object({
										name: z.string(),
									}),
									author: z
										.object({
											id: z.uuid(),
											name: z.string().nullable(),
											avatarUrl: z.url().nullable(),
										})
										.nullable(),
								})
							),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();

				const user = await prisma.user.findUnique({
					where: {
						id: userId,
					},
				});

				if (!user) {
					throw new BadRequestError(
						"User not found.",
						BusinessException.NOT_FOUND,
						"The user with the specified ID was not found."
					);
				}

				const invites = await prisma.invite.findMany({
					select: {
						id: true,
						email: true,
						role: true,
						createdAt: true,
						author: {
							select: {
								id: true,
								name: true,
								avatarUrl: true,
							},
						},
						organization: {
							select: {
								name: true,
							},
						},
					},
					where: {
						email: user.email,
					},
				});

				return reply.status(200).send({ invites });
			}
		);
}
