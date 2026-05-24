/** biome-ignore-all lint/suspicious/useAwait: required by @fastify */

import { env } from "@repo/env";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AuthException } from "@/http/_errors/exceptions/auth";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function authenticateWithGithubRoute(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/sessions/github",
		{
			schema: {
				tags: ["Auth"],
				summary: "/sessions/github",
				description: "Authenticate with Github",
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
				env.GITHUB_OAUTH_CLIENT_ID ?? ""
			);
			githubOAuthUrl.searchParams.set(
				"client_secret",
				env.GITHUB_OAUTH_CLIENT_SECRET ?? ""
			);
			githubOAuthUrl.searchParams.set(
				"redirect_uri",
				env.GITHUB_OAUTH_REDIRECT_URI ?? ""
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

			let resolvedEmail = email;

			if (resolvedEmail === null) {
				const emailsResponse = await fetch(
					"https://api.github.com/user/emails",
					{
						headers: {
							Authorization: `Bearer ${githubAccessToken}`,
						},
					}
				);

				const emailsData = await emailsResponse.json();

				const emails = z
					.array(
						z.object({
							email: z.string().email(),
							primary: z.boolean(),
							verified: z.boolean(),
						})
					)
					.parse(emailsData);

				const primaryEmail = emails.find((e) => e.primary && e.verified);

				if (!primaryEmail) {
					throw new BadRequestError(
						"Invalid credentials",
						AuthException.GITHUB_NO_EMAIL,
						"The user does not have an email associated with their GitHub account."
					);
				}

				resolvedEmail = primaryEmail.email;
			}

			let user = await prisma.user.findUnique({
				where: { email: resolvedEmail },
			});

			if (!user) {
				user = await prisma.user.create({
					data: {
						name,
						email: resolvedEmail,
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
