"use server";

import { type Role, roleSchema } from "@repo/rbac/src/types/role";
import { HTTPError } from "ky";
import { revalidateTag } from "next/cache";
import z from "zod";
import { createInvite } from "@/api/http/services/create-invite";
import { removeMember } from "@/api/http/services/remove-member";
import { revokeInvite } from "@/api/http/services/revoke-invite";
import { updateMember } from "@/api/http/services/update-member";
import { getCurrentOrganization } from "@/providers/auth-provider";

const createInviteSchema = z.object({
	email: z.email({
		message: "The user's email should be a valid email address",
	}),
	role: roleSchema,
});

export async function removeMemberAction(memberId: string) {
	const currentOrganization = await getCurrentOrganization();

	await removeMember({
		memberId,
		// biome-ignore lint/style/noNonNullAssertion: always come as string
		organization: currentOrganization!,
	});

	revalidateTag(`${currentOrganization}/members`, "max");
}

export async function updateMemberAction(memberId: string, role: Role) {
	const currentOrganization = await getCurrentOrganization();

	await updateMember({
		memberId,
		// biome-ignore lint/style/noNonNullAssertion: always come as string
		organization: currentOrganization!,
		role,
	});

	revalidateTag(`${currentOrganization}/members`, "max");
}

export async function createInviteAction(data: FormData) {
	const result = createInviteSchema.safeParse(Object.fromEntries(data));

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;

		return { success: false, title: null, description: null, errors };
	}

	const { email, role } = result.data;

	const currentOrganization = await getCurrentOrganization();

	try {
		await createInvite({
			// biome-ignore lint/style/noNonNullAssertion: always come as string
			organization: currentOrganization!,
			email,
			role,
		});

		revalidateTag(`${currentOrganization}/invites`, "max");
	} catch (error) {
		if (error instanceof HTTPError) {
			const { title, description } = error.data as {
				title: string | null;
				description: string | null;
			};

			return {
				success: false,
				title,
				description,
				errors: null,
			};
		}

		return {
			success: false,
			title: "Unexpected error",
			description: "Try again in a few minutes.",
			errors: null,
		};
	}

	return {
		success: true,
		title: "Project saved!",
		description: "Successfully created the invite.",
		errors: null,
	};
}

export async function revokeInviteAction(inviteId: string) {
	const currentOrganization = await getCurrentOrganization();

	await revokeInvite({
		inviteId,
		// biome-ignore lint/style/noNonNullAssertion: always come as string
		organization: currentOrganization!,
	});

	revalidateTag(`${currentOrganization}/invites`, "max");
}
