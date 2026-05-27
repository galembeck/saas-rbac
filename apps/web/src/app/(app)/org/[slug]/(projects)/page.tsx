import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ability, getCurrentOrganization } from "@/providers/auth-provider";
import { ProjectsList } from "./~components/projects-list";

export default async function OrganizationProjectsPage() {
	const permissions = await ability();

	const currentOrganization = await getCurrentOrganization();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">Projects</h1>

				{permissions?.can("create", "Project") && (
					<Button asChild size="sm">
						<Link href={`/org/${currentOrganization}/create-project`}>
							<Plus className="mr-2 size-4" />
							Create project
						</Link>
					</Button>
				)}
			</div>

			{permissions?.can("get", "Project") ? (
				<ProjectsList />
			) : (
				<p className="text-muted-foreground text-sm">
					You are not allowed to see organization projects
				</p>
			)}
		</div>
	);
}
