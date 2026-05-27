import type { Role } from "@repo/rbac/src/types/role";
import { api } from "../api-client";

interface CreateInviteRequest {
	email: string;
	organization: string;
	role: Role;
}

export async function createInvite({
	organization,
	email,
	role,
}: CreateInviteRequest) {
	await api.post(`organizations/${organization}/invites`, {
		json: {
			email,
			role,
		},
	});
}
