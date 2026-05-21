/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { BusinessException } from "@/http/_errors/exceptions/business/business";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getInviteRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get(
		"/invites/:inviteId",
		{
			schema: {
				tags: ["Invites"],
				summary: "/invites/:inviteId",
				description: "Get an invite details by its ID",
				params: z.object({
					inviteId: z.uuid(),
				}),
				response: {
					200: z.object({
						invite: z.object({
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
						}),
					}),
				},
			},
		},
		async (request, reply) => {
			const { inviteId } = request.params;

			const invite = await prisma.invite.findUnique({
				where: {
					id: inviteId,
				},
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
			});

			if (!invite) {
				throw new BadRequestError(
					"Invite not found.",
					BusinessException.NOT_FOUND,
					"The invite with the specified ID was not found."
				);
			}

			return reply.status(200).send({ invite });
		}
	);
}
