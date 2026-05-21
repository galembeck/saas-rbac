/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { OrganizationException } from "@/http/_errors/exceptions/organization";
import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/utils/create-slug";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createOrganizationRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			"/organizations",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations",
					description: "Create a new organization",
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
						domain: z.string().nullish(),
						shouldAttachUsersByDomain: z.boolean().optional(),
					}),
					response: {
						201: z.object({
							organizationId: z.uuid(),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId();

				const { name, domain, shouldAttachUsersByDomain } = request.body;

				if (domain) {
					const organizationByDomain = await prisma.organization.findUnique({
						where: { domain },
					});

					if (organizationByDomain) {
						throw new BadRequestError(
							"Another organization with same domain already exists.",
							OrganizationException.DOMAIN_ALREADY_IN_USE
						);
					}
				}

				const organization = await prisma.organization.create({
					data: {
						name,
						slug: createSlug(name),
						domain,
						shouldAttachUsersByDomain,
						ownerId: userId,
						members: {
							create: {
								userId,
								role: "ADMIN",
							},
						},
					},
				});

				return reply.status(201).send({
					organizationId: organization.id,
				});
			}
		);
}
