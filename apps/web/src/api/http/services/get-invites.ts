import type { Role } from "@repo/rbac/src/types/role";
import { api } from "../api-client";

interface GetInvitesResponse {
	invites: {
		id: string;
		role: Role;
		email: string;
		createdAt: string;
		author: {
			id: string;
			name: string | null;
			email: string;
		} | null;
	}[];
}

export async function getInvites(orgSlug: string) {
	const result = await api
		.get(`organizations/${orgSlug}/invites`, {
			next: {
				tags: [`${orgSlug}/invites`],
			},
		})
		.json<GetInvitesResponse>();

	return result;
}
