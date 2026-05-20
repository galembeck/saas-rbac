import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { UserException } from "@/http/_errors/exceptions/user";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

// biome-ignore lint/suspicious/useAwait: required by @fastify
export async function createAccountRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/users",
		{
			schema: {
				tags: ["User"],
				summary: "/users",
				description: "Create a new account",
				body: z.object({
					name: z.string(),
					email: z.email(),
					password: z.string().min(6),
				}),
			},
		},
		async (request, reply) => {
			const { name, email, password } = request.body;

			const userWithSameEmail = await prisma.user.findUnique({
				where: { email },
			});

			if (userWithSameEmail) {
				throw new BadRequestError(null, UserException.EMAIL_ALREADY_REGISTERED);
			}

			const [, domain] = email.split("@");

			const autoJoinOrganization = await prisma.organization.findFirst({
				where: {
					domain,
					shouldAttachUsersByDomain: true,
				},
			});

			const passwordHash = await hash(password, 6);

			await prisma.user.create({
				data: {
					name,
					email,
					passwordHash,
					member_on: autoJoinOrganization
						? {
								create: {
									organizationId: autoJoinOrganization.id,
								},
							}
						: undefined,
				},
			});

			return reply.status(201).send();
		}
	);
}
