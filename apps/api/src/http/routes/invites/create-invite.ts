/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
import { getUserPermissions } from "@repo/rbac/src/utils/get-user-permissions";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { InviteException } from "@/http/_errors/exceptions/invite";
import { OrganizationException } from "@/http/_errors/exceptions/organization";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";
import { UnauthorizedError } from "../_errors/unauthorized-error";

export async function createInviteRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations/:slug/invites",
			{
				schema: {
					tags: ["Invites"],
					summary: "/organizations/:slug/invites",
					description: "Create a new invite for an organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						email: z.email(),
						role: roleSchema,
					}),
					params: z.object({
						slug: z.string(),
					}),
					response: {
						201: z.object({
							inviteId: z.uuid(),
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

				if (cannot("create", "Invite")) {
					throw new UnauthorizedError(
						"You are not authorized to create an invite for this organization.",
						AuthException.UNAUTHORIZED,
						"User must have enough permission(s) in order to create an invite for this organization."
					);
				}

				const { email, role } = request.body;

				const [_, domain] = email.split("@");

				if (
					organization.shouldAttachUsersByDomain &&
					organization.domain === domain
				) {
					throw new BadRequestError(
						"Automatically attaching users to your organization.",
						OrganizationException.AUTOMATICALLY_ATTACHING_USERS,
						`Users with "${domain}" domain will join your organization automatically on login.`
					);
				}

				const inviteWithSameEmail = await prisma.invite.findUnique({
					where: {
						email_organizationId: {
							email,
							organizationId: organization.id,
						},
					},
				});

				if (inviteWithSameEmail) {
					throw new BadRequestError(
						"Invite already exists for this email.",
						InviteException.INVITE_ALREADY_EXISTS,
						"Another invite with the same e-mail already exists for this organization."
					);
				}

				const memberWithSameEmail = await prisma.member.findFirst({
					where: {
						organizationId: organization.id,
						user: {
							email,
						},
					},
				});

				if (memberWithSameEmail) {
					throw new BadRequestError(
						"Member already exists in this organization.",
						OrganizationException.MEMBER_ALREADY_EXISTS,
						"There is already a member with this e-mail registered in this organization."
					);
				}

				const invite = await prisma.invite.create({
					data: {
						organizationId: organization.id,
						email,
						role,
						authorId: userId,
					},
				});

				return reply.status(201).send({
					inviteId: invite.id,
				});
			}
		);
}
