/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/utils/create-slug";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function createProjectRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations/:slug/projects",
			{
				schema: {
					tags: ["Projects"],
					summary: "/organizations/:slug/projects",
					description: "Create a new project inside an organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						description: z.string(),
					}),
					params: z.object({
						slug: z.string(),
					}),
					reponse: {
						201: z.object({
							projectId: z.uuid(),
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

				if (cannot("create", "Project")) {
					throw new UnauthorizedError(
						"You are not authorized to create a project in this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to create a project in this organization."
					);
				}

				const { name, description } = request.body;

				const project = await prisma.project.create({
					data: {
						name,
						slug: createSlug(name),
						description,
						organizationId: organization.id,
						ownerId: userId,
					},
				});

				return reply.status(201).send({
					projectId: project.id,
				});
			}
		);
}
