import { api } from "../api-client";

interface DeleteOrganizationRequest {
	organization: string;
}

export async function deleteOrganization({
	organization,
}: DeleteOrganizationRequest) {
	await api.delete(`organizations/${organization}`);
}
