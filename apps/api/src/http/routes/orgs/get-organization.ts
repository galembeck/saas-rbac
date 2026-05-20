/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { auth } from "@/http/middlewares/auth";

export async function getOrganizationRoute(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			"/organizations/:slug",
			{
				schema: {
					tags: ["Organization"],
					summary: "/organizations/:slug",
					description: "Get details from an organization by its slug.",
					security: [{ bearerAuth: [] }],
					params: z.object({
						slug: z.string(),
					}),
					response: {
						200: z.object({
							organization: z.object({
								id: z.uuid(),
								name: z.string(),
								slug: z.string(),
								domain: z.string().nullable(),
								shouldAttachUsersByDomain: z.boolean(),
								avatarUrl: z.url().nullable(),
								createdAt: z.date(),
								updatedAt: z.date(),
								ownerId: z.uuid(),
							}),
						}),
					},
				},
			},
			async (request) => {
				const { slug } = request.params;

				const { organization } = await request.getUserMembership(slug);

				return {
					organization,
				};
			}
		);
}
