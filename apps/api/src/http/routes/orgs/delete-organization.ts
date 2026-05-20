/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { organizationSchema } from "@repo/rbac/src/models/organization.model";
import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function deleteOrganizationRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			"/organizations/:slug",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations/:slug",
					description:
						"Delete an organization (with required permissions) by its slug.",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					reponse: {
						204: z.null(),
					},
				},
			},
			async (request, reply) => {
				const { slug } = request.params;

				const userId = await request.getCurrentUserId();
				const { membership, organization } =
					await request.getUserMembership(slug);

				const authOrganization = organizationSchema.parse(organization);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("delete", authOrganization)) {
					throw new UnauthorizedError(
						"You are not authorized to delete this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to delete this organization."
					);
				}

				await prisma.organization.delete({
					where: {
						id: organization.id,
					},
				});

				return reply.status(204).send();
			}
		);
}
