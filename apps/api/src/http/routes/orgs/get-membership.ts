/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { roleSchema } from "@repo/rbac/src/types/role";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { auth } from "@/http/middlewares/auth";

export async function getMembershipRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug/membership",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations/{slug}/membership",
					description: "Get user membership on an organization",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							membership: z.object({
								id: z.uuid(),
								role: roleSchema,
								userId: z.uuid(),
								organizationId: z.uuid(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params;

				const { membership } = await request.getUserMembership(slug);

				return {
					membership: {
						id: membership.id,
						role: membership.role,
						userId: membership.userId,
						organizationId: membership.organizationId,
					},
				};
			}
		);
}
