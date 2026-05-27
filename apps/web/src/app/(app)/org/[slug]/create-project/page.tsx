import { redirect } from "next/navigation";
import { ability, getCurrentOrganization } from "@/providers/auth-provider";
import { ProjectForm } from "./~components/project-form";

export default async function CreateOrganizationProjectPage() {
	const orgSlug = await getCurrentOrganization();

	const permissions = await ability();

	if (permissions?.cannot("create", "Project")) {
		redirect(`/org/${orgSlug}`);
	}

	return (
		<div className="space-y-4">
			<h1 className="font-semibold text-2xl">Create project</h1>

			<ProjectForm />
		</div>
	);
}
