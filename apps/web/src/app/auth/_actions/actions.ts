"use server";

import { redirect } from "next/navigation";

// biome-ignore lint/suspicious/useAwait: required by "use server"
export async function signInWithGithub() {
	const githubSignInUrl = new URL(
		"login/oauth/authorize",
		"https://github.com"
	);

	githubSignInUrl.searchParams.set("client_id", "Ov23liP43vNnUIihJmCs");
	githubSignInUrl.searchParams.set(
		"redirect_uri",
		"http://localhost:3000/api/auth/callback"
	);
	githubSignInUrl.searchParams.set("scope", "user");

	redirect(githubSignInUrl.toString());
}
