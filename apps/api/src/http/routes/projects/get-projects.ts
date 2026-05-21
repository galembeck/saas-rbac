/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getProjectsRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/projects",
			{
				schema: {
					tags: ["Projects"],
					summary: "/organizations/:slug/projects",
					description: "Get all projects in an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							projects: z.array(
								z.object({
									id: z.uuid(),
									description: z.string(),
									name: z.string(),
									slug: z.string(),
									avatarUrl: z.url().nullable(),
									organizationId: z.uuid(),
									ownerId: z.uuid(),
									createdAt: z.date(),
									owner: z.object({
										id: z.uuid(),
										name: z.string().nullable(),
										avatarUrl: z.url().nullable(),
									}),
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

				if (cannot("get", "Project")) {
					throw new UnauthorizedError(
						"You are not authorized to see this project.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to see this project."
					);
				}

				const projects = await prisma.project.findMany({
					select: {
						id: true,
						name: true,
						description: true,
						slug: true,
						ownerId: true,
						avatarUrl: true,
						organizationId: true,
						createdAt: true,
						owner: {
							select: {
								id: true,
								name: true,
								avatarUrl: true,
							},
						},
					},
					where: {
						organizationId: organization.id,
					},
					orderBy: {
						createdAt: "desc",
					},
				});

				return reply.status(200).send({ projects });
			}
		);
}
