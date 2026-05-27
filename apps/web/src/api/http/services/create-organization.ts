import { api } from "../api-client";

interface CreateOrganization {
	domain: string | null;
	name: string;
	shouldAttachUsersByDomain: boolean;
}

export async function createOrganization({
	name,
	domain,
	shouldAttachUsersByDomain,
}: CreateOrganization) {
	await api.post("organizations", {
		json: {
			name,
			domain,
			shouldAttachUsersByDomain,
		},
	});
}
