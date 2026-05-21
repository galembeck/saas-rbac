/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { BusinessException } from "@/http/_errors/exceptions/business/business";
import { InviteException } from "@/http/_errors/exceptions/invite";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function acceptInviteRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/invites/:inviteId/accept",
			{
				schema: {
					tags: ["Invites"],
					summary: "/invites/:inviteId/accept",
					description: "Accept an invite by its ID",
					params: z.object({
						inviteId: z.uuid(),
					}),
				},
			},
			async (request, reply) => {
				const { inviteId } = request.params;

				const userId = await request.getCurrentUserId();

				const invite = await prisma.invite.findUnique({
					where: {
						id: inviteId,
					},
				});

				if (!invite) {
					throw new BadRequestError(
						"Invite not found or expired.",
						InviteException.NOT_FOUND_OR_EXPIRED,
						"The invite with the specified ID was not found or already expired."
					);
				}

				const user = await prisma.user.findUnique({
					where: {
						id: userId,
					},
				});

				if (!user) {
					throw new BadRequestError(
						"User not found.",
						BusinessException.NOT_FOUND,
						"The user with the specified ID was not found."
					);
				}

				if (invite.email !== user.email) {
					throw new BadRequestError(
						"This invite belongs to another user.",
						InviteException.BELONGS_TO_OTHER_USER,
						"The invite does not belong to the user with the specified ID."
					);
				}

				await prisma.$transaction([
					prisma.member.create({
						data: {
							userId,
							organizationId: invite.organizationId,
							role: invite.role,
						},
					}),

					prisma.invite.delete({
						where: {
							id: inviteId,
						},
					}),
				]);

				return reply.status(204).send();
			}
		);
}
