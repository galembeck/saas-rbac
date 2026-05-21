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

export async function getMembersRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/members",
			{
				schema: {
					tags: ["Members"],
					summary: "/organizations/:slug/members",
					description: "Get all members in an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							members: z.array(
								z.object({
									id: z.uuid(),
									role: roleSchema,
									userId: z.uuid(),
									name: z.string().nullable(),
									email: z.email().nullable(),
									avatarUrl: z.url().nullable(),
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

				if (cannot("get", "User")) {
					throw new UnauthorizedError(
						"You are not authorized to see the members in this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to see the members in this organization."
					);
				}

				const members = await prisma.member.findMany({
					select: {
						id: true,
						role: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								avatarUrl: true,
							},
						},
					},
					where: {
						organizationId: organization.id,
					},
					orderBy: {
						role: "asc",
					},
				});

				const membersWithRoles = members.map(
					({ user: { id: userId, ...user }, ...member }) => ({
						...user,
						...member,
						userId,
					})
				);

				return reply.status(200).send({ members: membersWithRoles });
			}
		);
}
