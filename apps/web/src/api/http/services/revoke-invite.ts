import { api } from "../api-client";

interface RevokeInviteRequest {
	inviteId: string;
	organization: string;
}

export async function revokeInvite({
	organization,
	inviteId,
}: RevokeInviteRequest) {
	await api.delete(`organizations/${organization}/invites/${inviteId}`);
}
