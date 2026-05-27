"use client";

import { ChevronsUpDown, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenuTrigger } from "./ui/dropdown-menu";

interface Organization {
	avatarUrl: string | null;
	name: string;
}

interface OrganizationSwitchTriggerProps {
	currentOrganization: Organization | undefined;
}

function TriggerLabel({
	currentOrganization,
	isCreatingOrganization,
}: {
	currentOrganization: Organization | undefined;
	isCreatingOrganization: boolean;
}) {
	if (isCreatingOrganization) {
		return (
			<>
				<PlusCircle className="mr-1 size-5 text-muted-foreground" />
				<span className="truncate text-left">Create organization</span>
			</>
		);
	}

	if (currentOrganization) {
		return (
			<>
				<Avatar className="size-5">
					{currentOrganization.avatarUrl && (
						<AvatarImage
							className="size-auto"
							src={currentOrganization.avatarUrl}
						/>
					)}
					<AvatarFallback />
				</Avatar>

				<span className="truncate text-left">{currentOrganization.name}</span>
			</>
		);
	}

	return <span className="text-muted-foreground">Select organization</span>;
}

export function OrganizationSwitchTrigger({
	currentOrganization,
}: OrganizationSwitchTriggerProps) {
	const pathname = usePathname();

	const isCreatingOrganization = pathname === "/create-organization";

	return (
		<DropdownMenuTrigger className="flex w-42 cursor-pointer items-center gap-2 rounded p-1 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary">
			<TriggerLabel
				currentOrganization={currentOrganization}
				isCreatingOrganization={isCreatingOrganization}
			/>

			<ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
		</DropdownMenuTrigger>
	);
}
