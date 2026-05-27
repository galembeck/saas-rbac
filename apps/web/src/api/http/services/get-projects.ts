import { api } from "../api-client";

interface GetProjectsResponse {
	projects: {
		id: string;
		description: string;
		name: string;
		slug: string;
		avatarUrl: string | null;
		organizationId: string;
		ownerId: string;
		createdAt: string;
		owner: {
			id: string;
			name: string | null;
			avatarUrl: string | null;
		};
	}[];
}

export async function getProjects(orgSlug: string) {
	const result = await api
		.get(`organizations/${orgSlug}/projects`, {
			next: {
				tags: [`${orgSlug}/projects`],
			},
		})
		.json<GetProjectsResponse>();

	return result;
}
