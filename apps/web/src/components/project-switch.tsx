"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { getProjects } from "@/api/http/services/get-projects";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

interface Project {
	avatarUrl: string | null;
	name: string;
}

function TriggerLabel({
	isLoading,
	isCreatingProject,
	currentProject,
}: {
	isLoading: boolean;
	isCreatingProject: boolean;
	currentProject: Project | null | undefined;
}) {
	if (isLoading) {
		return (
			<>
				<Skeleton className="size-5 rounded-full" />
				<Skeleton className="h-5 w-full flex-1" />
			</>
		);
	}

	if (isCreatingProject) {
		return (
			<>
				<PlusCircle className="mr-1 size-5 text-muted-foreground" />
				<span className="truncate text-left">Create new</span>
			</>
		);
	}

	if (currentProject) {
		return (
			<>
				<Avatar className="size-5">
					{currentProject.avatarUrl && (
						<AvatarImage src={currentProject.avatarUrl} />
					)}
					<AvatarFallback />
				</Avatar>

				<span className="truncate text-left">{currentProject.name}</span>
			</>
		);
	}

	return <span className="text-muted-foreground">Select project</span>;
}

export function ProjectSwitch() {
	const { slug: orgSlug, project: projectSlug } = useParams<{
		slug: string;
		project: string;
	}>();
	const pathname = usePathname();

	const { data, isLoading } = useQuery({
		queryKey: [orgSlug, "projects"],
		queryFn: () => getProjects(orgSlug),
		enabled: !!orgSlug,
	});

	const currentProject =
		data && projectSlug
			? data.projects.find((project) => project.slug === projectSlug)
			: null;

	const isCreatingProject = pathname === `/org/${orgSlug}/create-project`;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex w-42 cursor-pointer items-center gap-2 rounded p-1 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary">
				<TriggerLabel
					currentProject={currentProject}
					isCreatingProject={isCreatingProject}
					isLoading={isLoading}
				/>

				{isLoading ? (
					<Loader2 className="ml-auto size-4 shrink-0 animate-spin text-muted-foreground" />
				) : (
					<ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
				)}
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				alignOffset={-16}
				className="w-50"
				sideOffset={12}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Projects</DropdownMenuLabel>
					{data?.projects.map((project) => (
						<DropdownMenuItem asChild key={project.id}>
							<Link href={`/org/${orgSlug}/project/${project.slug}`}>
								<Avatar className="mr-1 size-5">
									{project.avatarUrl && <AvatarImage src={project.avatarUrl} />}

									<AvatarFallback />
								</Avatar>

								<span className="line-clamp-1">{project.name}</span>
							</Link>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href={`/org/${orgSlug}/create-project`}>
						<PlusCircle className="mr-1 size-5" />
						Create new
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
