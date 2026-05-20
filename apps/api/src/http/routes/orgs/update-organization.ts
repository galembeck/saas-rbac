/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { organizationSchema } from "@repo/rbac/src/models/organization.model";
import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { OrganizationException } from "@/http/_errors/exceptions/organization";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function updateOrganizationRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			"/organizations/:slug",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations/:slug",
					description:
						"Update an organization detail(s)/information(s) by its slug.",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						shouldAttachUsersByDomain: z.boolean().optional(),
					}),
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

				const { name, shouldAttachUsersByDomain } = request.body;

				const authOrganization = organizationSchema.parse(organization);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("update", authOrganization)) {
					throw new UnauthorizedError(
						"You are not authorized to update this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to update this organization."
					);
				}

				if (organization.domain) {
					const organizationByDomain = await prisma.organization.findFirst({
						where: {
							domain: organization.domain,
							id: {
								not: organization.id,
							},
						},
					});

					if (organizationByDomain) {
						throw new BadRequestError(
							"Another organization with same domain already exists.",
							OrganizationException.DOMAIN_ALREADY_IN_USE
						);
					}
				}

				await prisma.organization.update({
					where: {
						id: organization.id,
					},
					data: {
						name,
						shouldAttachUsersByDomain,
					},
				});

				return reply.status(204).send();
			}
		);
}
