import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { getOrganizations } from "@/api/http/services/get-organizations";
import { getCurrentOrganization } from "@/providers/auth-provider";
import { OrganizationSwitchTrigger } from "./organization-switch-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export async function OrganizationSwitch() {
	const currentOrganizationSlug = await getCurrentOrganization();

	const { organizations } = await getOrganizations();

	const currentOrganization = organizations.find(
		(org) => org.slug === currentOrganizationSlug
	);

	return (
		<DropdownMenu>
			<OrganizationSwitchTrigger currentOrganization={currentOrganization} />

			<DropdownMenuContent
				align="end"
				alignOffset={-16}
				className="w-50"
				sideOffset={12}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>Organizations</DropdownMenuLabel>

					{organizations.map((organization) => (
						<DropdownMenuItem asChild key={organization.id}>
							<Link href={`/org/${organization.slug}`}>
								<Avatar className="mr-1 size-5">
									{organization.avatarUrl && (
										<AvatarImage
											className="size-auto"
											src={organization.avatarUrl}
										/>
									)}
									<AvatarFallback />
								</Avatar>

								<span className="line-clamp-1">{organization.name}</span>
							</Link>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuItem asChild>
					<Link href="/create-organization">
						<PlusCircle className="mr-1 size-5" />
						Create organization
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
