import type { Role } from "@repo/rbac/src/types/role";
import { api } from "../api-client";

interface GetPendingInvitesResponse {
	invites: {
		id: string;
		role: Role;
		email: string;
		createdAt: string;
		organization: {
			name: string;
		};
		author: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		} | null;
	}[];
}

export async function getPendingInvites() {
	const result = await api
		.get("invites/pending")
		.json<GetPendingInvitesResponse>();

	return result;
}
