/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getInvitesRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/invites",
			{
				schema: {
					tags: ["Invites"],
					summary: "/organizations/:slug/invites",
					description: "Get all invites for an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							invites: z.array(
								z.object({
									id: z.uuid(),
									role: roleSchema,
									email: z.email(),
									createdAt: z.date(),
									author: z
										.object({
											id: z.uuid(),
											name: z.string().nullable(),
											email: z.email(),
										})
										.nullable(),
								})
							),
						}),
					},
				},
			},
			async (request, reply) => {
				const { slug } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Invite")) {
					throw new UnauthorizedError(
						"You are not authorized to list invites for this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to list invites for this organization."
					);
				}

				const invites = await prisma.invite.findMany({
					where: {
						organizationId: organization.id,
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
								email: true,
							},
						},
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				return reply.status(200).send({ invites });
			}
		);
}
