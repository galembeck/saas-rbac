/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { ProjectException } from "@/http/_errors/exceptions/project";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function getProjectRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:orgSlug/projects/:projectSlug",
			{
				schema: {
					tags: ["Projects"],
					summary: "/organizations/:orgSlug/projects/:projectSlug",
					description: "Get a project by its slug",
					security: [{ bearerAuth: [] }],
					params: z.object({
						orgSlug: z.string(),
						projectSlug: z.string(),
					}),
					response: {
						200: z.object({
							project: z.object({
								id: z.uuid(),
								description: z.string(),
								name: z.string(),
								slug: z.string(),
								avatarUrl: z.url().nullable(),
								organizationId: z.uuid(),
								ownerId: z.uuid(),
								owner: z.object({
									id: z.uuid(),
									name: z.string().nullable(),
									avatarUrl: z.url().nullable(),
								}),
							}),
						}),
					},
				},
			},
			async (request, reply) => {
				const { orgSlug, projectSlug } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(orgSlug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("get", "Project")) {
					throw new UnauthorizedError(
						"You are not authorized to see this project.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to see this project."
					);
				}

				const project = await prisma.project.findUnique({
					select: {
						id: true,
						name: true,
						description: true,
						slug: true,
						ownerId: true,
						avatarUrl: true,
						organizationId: true,
						owner: {
							select: {
								id: true,
								name: true,
								avatarUrl: true,
							},
						},
					},
					where: {
						slug: projectSlug,
						organizationId: organization.id,
					},
				});

				if (!project) {
					throw new BadRequestError(
						"Project not found.",
						ProjectException.PROJECT_NOT_FOUND,
						"The target project could not be found in the organization."
					);
				}

				return reply.status(200).send({ project });
			}
		);
}
