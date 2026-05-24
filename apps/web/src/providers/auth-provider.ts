import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile } from "@/api/http/services/get-profile";

export async function isAuthenticated() {
	return !!(await cookies()).get("accessToken")?.value;
}

export async function auth() {
	const token = (await cookies()).get("accessToken")?.value;

	if (!token) {
		redirect("/auth/sign-in");
	}

	try {
		const { user } = await getProfile();

		return { user };
		// biome-ignore lint/suspicious/noEmptyBlockStatements: not required...
	} catch {}

	redirect("/api/auth/sign-out");
}
