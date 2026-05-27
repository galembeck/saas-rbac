import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowRight, Slash } from "lucide-react";
import Link from "next/link";
import { getProjects } from "@/api/http/services/get-projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ability, getCurrentOrganization } from "@/providers/auth-provider";
import { getInitials } from "@/utils/get-initials";
import { DeleteProjectButton } from "./delete-project-button";

dayjs.extend(relativeTime);

export async function ProjectsList() {
	const permissions = await ability();

	const currentOrganization = await getCurrentOrganization();

	// biome-ignore lint/style/noNonNullAssertion: always come as string
	const { projects } = await getProjects(currentOrganization!);

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{projects.map((project) => (
				<Card className="h-full" key={project.id}>
					<CardHeader className="flex-1">
						<CardTitle>{project.name}</CardTitle>

						{permissions?.can("delete", "Project") && (
							<CardAction>
								<DeleteProjectButton projectId={project.id} />
							</CardAction>
						)}

						<CardDescription className="line-clamp-2 leading-relaxed">
							{project.description}
						</CardDescription>
					</CardHeader>

					<CardFooter className="flex items-center gap-1.5">
						<Avatar className="size-6">
							{project.owner.avatarUrl && (
								<AvatarImage src={project.owner.avatarUrl} />
							)}

							<AvatarFallback>{getInitials(project.name)}</AvatarFallback>
						</Avatar>

						<span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
							<span className="font-medium text-foreground">
								{project.owner.name}
							</span>{" "}
							<Slash className="size-3 rotate-[-24deg]" />
							{dayjs(project.createdAt).fromNow()}
						</span>

						<Button asChild className="ml-auto" size="xs" variant="outline">
							<Link
								href={`/org/${currentOrganization}/project/${project.slug}`}
							>
								View
								<ArrowRight className="ml-2 size-3" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
