import { api } from "../api-client";

interface CreateProjectRequest {
	description: string;
	name: string;
	orgSlug: string | null;
}

export async function createProject({
	orgSlug,
	name,
	description,
}: CreateProjectRequest) {
	await api.post(`organizations/${orgSlug}/projects`, {
		json: {
			name,
			description,
		},
	});
}
