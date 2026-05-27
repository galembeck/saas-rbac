import { api } from "../api-client";

interface RemoveMemberRequest {
	memberId: string;
	organization: string;
}

export async function removeMember({
	organization,
	memberId,
}: RemoveMemberRequest) {
	await api.delete(`organizations/${organization}/member/${memberId}`);
}
