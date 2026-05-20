/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function authenticateWithGithubRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/sessions/github",
		{
			schema: {
				tags: ["Auth"],
				summary: "Authenticate with Github",
				body: z.object({
					code: z.string(),
				}),
				response: {
					200: z.object({
						accessToken: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { code } = request.body;

			const githubOAuthUrl = new URL(
				"https://github.com/login/oauth/access_token"
			);

			githubOAuthUrl.searchParams.set(
				"client_id",
				process.env.GITHUB_CLIENT_ID ?? ""
			);
			githubOAuthUrl.searchParams.set(
				"client_secret",
				process.env.GITHUB_CLIENT_SECRET ?? ""
			);
			githubOAuthUrl.searchParams.set(
				"redirect_uri",
				process.env.GITHUB_REDIRECT_URI ?? ""
			);
			githubOAuthUrl.searchParams.set("code", code);

			const githubAccessTokenResponse = await fetch(githubOAuthUrl, {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
			});

			const githubAccessTokenData = await githubAccessTokenResponse.json();

			const { access_token: githubAccessToken } = z
				.object({
					access_token: z.string(),
					token_type: z.literal("bearer"),
					scope: z.string(),
				})
				.parse(githubAccessTokenData);

			const githubUserResponse = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${githubAccessToken}`,
				},
			});

			const githubUserData = await githubUserResponse.json();

			const {
				id: githubId,
				avatar_url: githubAvatarUrl,
				name,
				email,
			} = z
				.object({
					id: z.number().int().transform(String),
					avatar_url: z.url(),
					name: z.string().nullable(),
					email: z.string().nullable(),
				})
				.parse(githubUserData);

			if (email === null) {
				throw new BadRequestError(
					"Your Github account must have an email address to authenticate."
				);
			}

			let user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user) {
				user = await prisma.user.create({
					data: {
						name,
						email,
						avatarUrl: githubAvatarUrl,
					},
				});
			}

			let account = await prisma.account.findUnique({
				where: {
					provider_userId: {
						provider: "GITHUB",
						userId: user.id,
					},
				},
			});

			if (!account) {
				account = await prisma.account.create({
					data: {
						provider: "GITHUB",
						providerAccountId: githubId,
						userId: user.id,
					},
				});
			}

			const accessToken = await reply.jwtSign(
				{
					sub: user.id,
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
