"use server";

import { env } from "@repo/env";
import { redirect } from "next/navigation";

// biome-ignore lint/suspicious/useAwait: required by "use server"
export async function signInWithGithub() {
	const githubSignInUrl = new URL(
		"login/oauth/authorize",
		"https://github.com"
	);

	githubSignInUrl.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
	githubSignInUrl.searchParams.set(
		"redirect_uri",
		env.GITHUB_OAUTH_REDIRECT_URI
	);
	githubSignInUrl.searchParams.set("scope", "user");

	redirect(githubSignInUrl.toString());
}
