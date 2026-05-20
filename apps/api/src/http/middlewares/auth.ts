/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { prisma } from "@/lib/prisma";
import { AuthException } from "../_errors/exceptions/auth";
import { UnauthorizedError } from "../routes/_errors/unauthorized-error";

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook("preHandler", async (request) => {
		request.getCurrentUserId = async () => {
			try {
				const { sub } = await request.jwtVerify<{ sub: string }>();

				return sub;
			} catch {
				throw new UnauthorizedError(null, AuthException.INVALID_TOKEN);
			}
		};

		request.getUserMembership = async (slug: string) => {
			const userId = await request.getCurrentUserId();

			const member = await prisma.member.findFirst({
				where: {
					userId,
					organization: {
						slug,
					},
				},

				include: {
					organization: true,
				},
			});

			if (!member) {
				throw new UnauthorizedError(
					"User is not a member of this organization.",
					AuthException.UNAUTHORIZED
				);
			}

			const { organization, ...membership } = member;

			return {
				organization,
				membership,
			};
		};
	});
});
