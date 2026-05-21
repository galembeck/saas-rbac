/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { BusinessException } from "@/http/_errors/exceptions/business/business";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function revokeInviteRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations/:slug/invites/:inviteId",
			{
				schema: {
					tags: ["Invites"],
					summary: "/organizations/:slug/invites/:inviteId",
					description: "Revoke an invite for an organization by its ID",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						inviteId: z.uuid(),
					}),
				},
			},
			async (request, reply) => {
				const { slug, inviteId } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(slug);

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("delete", "Invite")) {
					throw new UnauthorizedError(
						"You are not authorized to revoke an invite for this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to revoke an invite for this organization."
					);
				}

				const invite = await prisma.invite.findUnique({
					where: {
						id: inviteId,
						organizationId: organization.id,
					},
				});

				if (!invite) {
					throw new BadRequestError(
						"Invite not found.",
						BusinessException.NOT_FOUND,
						"The invite with the specified ID was not found."
					);
				}

				await prisma.invite.delete({
					where: {
						id: inviteId,
					},
				});

				return reply.status(204).send();
			}
		);
}
