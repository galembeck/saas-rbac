import type { Role } from "@repo/rbac/src/types/role";
import { api } from "../api-client";

interface UpdateMemberRequest {
	memberId: string;
	organization: string;
	role: Role;
}

export async function updateMember({
	organization,
	memberId,
	role,
}: UpdateMemberRequest) {
	await api.delete(`organizations/${organization}/member/${memberId}`, {
		json: {
			role,
		},
	});
}
