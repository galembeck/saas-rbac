/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { projectSchema } from "@repo/rbac/src/models/project.model";
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

export async function updateProjectRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			"/organizations/:slug/projects/:projectId",
			{
				schema: {
					tags: ["Projects"],
					summary: "/organizations/:slug/projects/:projectId",
					description: "Update a project inside an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						projectId: z.uuid(),
					}),
					body: z.object({
						name: z.string(),
						description: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { slug, projectId } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(slug);

				const project = await prisma.project.findUnique({
					where: {
						id: projectId,
						organizationId: organization.id,
					},
				});

				if (!project) {
					throw new BadRequestError(
						"Project not found in this organization.",
						ProjectException.PROJECT_NOT_FOUND,
						"A valid and existing project ID is required to delete a project in an organization."
					);
				}

				const { cannot } = getUserPermissions(userId, membership.role);

				const authProject = projectSchema.parse(project);

				if (cannot("update", authProject)) {
					throw new UnauthorizedError(
						"You are not authorized to update this project.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to update this project."
					);
				}

				const { name, description } = request.body;

				await prisma.project.update({
					where: {
						id: projectId,
					},
					data: {
						name,
						description,
					},
				});

				return reply.status(204).send();
			}
		);
}
