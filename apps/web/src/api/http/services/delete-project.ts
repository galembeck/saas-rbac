import { api } from "../api-client";

interface DeleteProjectRequest {
	organization: string;
	projectId: string;
}

export async function DeleteProject({
	organization,
	projectId,
}: DeleteProjectRequest) {
	await api.delete(`organizations/${organization}/projects/${projectId}`);
}
