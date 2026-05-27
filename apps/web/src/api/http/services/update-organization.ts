import { api } from "../api-client";

interface UpdateOrganization {
	domain: string | null;
	name: string;
	organization: string;
	shouldAttachUsersByDomain: boolean;
}

export async function updateOrganization({
	organization,
	name,
	domain,
	shouldAttachUsersByDomain,
}: UpdateOrganization) {
	await api.put(`organizations/${organization}`, {
		json: {
			name,
			domain,
			shouldAttachUsersByDomain,
		},
	});
}
