import { defineAbilityFor } from "@repo/rbac";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMembership } from "@/api/http/services/get-membership";
import { getProfile } from "@/api/http/services/get-profile";

export async function isAuthenticated() {
	return !!(await cookies()).get("accessToken")?.value;
}

export async function getCurrentOrganization() {
	return (await cookies()).get("org")?.value ?? null;
}

export async function getCurrentMembership() {
	const organization = await getCurrentOrganization();

	if (!organization) {
		return null;
	}

	const { membership } = await getMembership(organization);

	return membership;
}

export async function ability() {
	const membership = await getCurrentMembership();

	if (!membership) {
		return null;
	}

	const ability = defineAbilityFor({
		id: membership.userId,
		role: membership.role,
	});

	return ability;
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
