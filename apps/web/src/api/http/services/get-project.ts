import { api } from "../api-client";

interface GetProjectResponse {
	project: {
		id: string;
		description: string;
		name: string;
		slug: string;
		avatarUrl: string | null;
		ProjectId: string;
		ownerId: string;
		owner: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	};
}

export async function getProject(orgSlug: string, projectSlug: string) {
	const result = await api
		.get(`organizations/${orgSlug}/projects/${projectSlug}`)
		.json<GetProjectResponse>();

	return result;
}
