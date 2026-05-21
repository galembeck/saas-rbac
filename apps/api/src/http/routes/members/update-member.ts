/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
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

export async function updateMemberRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			"/organizations/:slug/members/:memberId",
			{
				schema: {
					tags: ["Members"],
					summary: "/organizations/:slug/members/:memberId",
					description: "Update a member inside an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
						memberId: z.uuid(),
					}),
					body: z.object({
						role: roleSchema,
					}),
				},
			},
			async (request, reply) => {
				const { slug, memberId } = request.params;

				const userId = await request.getCurrentUserId();
				const { organization, membership } =
					await request.getUserMembership(slug);

				const member = await prisma.member.findUnique({
					where: {
						id: memberId,
						organizationId: organization.id,
					},
				});

				if (!member) {
					throw new BadRequestError(
						"Member not found in this organization.",
						BusinessException.NOT_FOUND,
						"A valid and existing member ID is required to update a member in an organization."
					);
				}

				const { cannot } = getUserPermissions(userId, membership.role);

				if (cannot("update", "User")) {
					throw new UnauthorizedError(
						"You are not authorized to update this member.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to update this member."
					);
				}

				const { role } = request.body;

				await prisma.member.update({
					where: {
						id: memberId,
						organizationId: organization.id,
					},
					data: {
						role,
					},
				});

				return reply.status(204).send();
			}
		);
}
