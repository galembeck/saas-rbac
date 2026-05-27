import { getProject } from "@/api/http/services/get-project";
import { getCurrentOrganization } from "@/providers/auth-provider";

interface OrganizationProjectPageProps {
	params: Promise<{ project: string }>;
}

export default async function OrganizationProjectPage({
	params,
}: OrganizationProjectPageProps) {
	const currentOrganization = await getCurrentOrganization();

	const { project: projectSlug } = await params;

	// biome-ignore lint/style/noNonNullAssertion: always come as string
	const { project } = await getProject(currentOrganization!, projectSlug);

	return (
		<div className="space-y-4">
			<h1 className="font-semibold text-2xl">{project.name}</h1>
		</div>
	);
}
