import { Slash } from "lucide-react";
import Link from "next/link";
import { ability } from "@/providers/auth-provider";
import { RocketseatIcon } from "./icons/rocketseat-icon";
import { OrganizationSwitch } from "./organization-switch";
import { PendingInvites } from "./pending-invites";
import { ProfileButton } from "./profile-button";
import { ProjectSwitch } from "./project-switch";
import { ThemeToggle } from "./theme/theme-toggle";
import { Separator } from "./ui/separator";

export async function Header() {
	const permissions = await ability();

	return (
		<div className="mx-auto flex max-w-300 items-center justify-between">
			<div className="flex items-center gap-3">
				<Link href="/">
					<RocketseatIcon className="size-6 dark:invert" />
				</Link>

				<Slash className="size-3 rotate-[-24deg] text-border" />

				<OrganizationSwitch />

				{permissions?.can("get", "Project") && (
					<>
						<Slash className="size-3 rotate-[-24deg] text-border" />

						<ProjectSwitch />
					</>
				)}
			</div>

			<div className="flex items-center gap-4">
				<PendingInvites />

				<ThemeToggle />

				<Separator orientation="vertical" />

				<ProfileButton />
			</div>
		</div>
	);
}
