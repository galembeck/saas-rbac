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

export async function transferOwnershipRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.patch(
			"/organizations/:slug/ownership",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations/:slug",
					description:
						"Update an organization ownership by its slug, transfering it to another registered user.",
					security: [{ bearerAuth: [] }],
					body: z.object({
						transferToUserId: z.uuid(),
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

				const { transferToUserId } = request.body;

				const authOrganization = organizationSchema.parse(organization);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("transfer_ownership", authOrganization)) {
					throw new UnauthorizedError(
						"You are not authorized to transfer the ownership of this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to transfer the ownership of this organization."
					);
				}

				const transferMembership = await prisma.member.findUnique({
					where: {
						organizationId_userId: {
							organizationId: organization.id,
							userId: transferToUserId,
						},
					},
				});

				if (!transferMembership) {
					throw new BadRequestError(
						"Target user is not a member of the organization.",
						OrganizationException.USER_NOT_MEMBER,
						"The user needs to be a member of the organization in order to transfer its ownership."
					);
				}

				await prisma.$transaction([
					prisma.member.update({
						where: {
							organizationId_userId: {
								organizationId: organization.id,
								userId: transferToUserId,
							},
						},
						data: {
							role: "ADMIN",
						},
					}),

					prisma.organization.update({
						where: {
							id: organization.id,
						},
						data: {
							ownerId: transferToUserId,
						},
					}),
				]);

				return reply.status(204).send();
			}
		);
}
