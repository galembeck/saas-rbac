import { compare } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

// biome-ignore lint/suspicious/useAwait: required by @fastify
export async function authenticateWithPasswordRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/sessions/password",
		{
			schema: {
				tags: ["Auth"],
				summary: "Authenticate with e-mail & password",
				body: z.object({
					email: z.email(),
					password: z.string(),
				}),
				response: {
					200: z.object({
						accessToken: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

			const userFromEmail = await prisma.user.findUnique({
				where: { email },
			});

			if (!userFromEmail) {
				throw new BadRequestError("Invalid credentials");
			}

			if (userFromEmail?.passwordHash === null) {
				throw new BadRequestError(
					"User does not have a password, use social login."
				);
			}

			const isPasswordValid = await compare(
				password,
				userFromEmail.passwordHash
			);

			if (!isPasswordValid) {
				throw new BadRequestError("Invalid credentials.");
			}

			const accessToken = await reply.jwtSign(
				{
					sub: userFromEmail.id,
				},
				{
					sign: {
						expiresIn: "7d",
					},
				}
			);

			return reply.status(200).send({ accessToken });
		}
	);
}
