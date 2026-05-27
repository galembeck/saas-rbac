import type { Role } from "@repo/rbac/src/types/role";
import { api } from "../api-client";

interface GetMembersResponse {
	members: {
		id: string;
		role: Role;
		userId: string;
		name: string | null;
		email: string | null;
		avatarUrl: string | null;
	}[];
}

export async function getMembers(slug: string) {
	const result = await api
		.get(`organizations/${slug}/members`, {
			next: {
				tags: [`${slug}/members`],
			},
		})
		.json<GetMembersResponse>();

	return result;
}
