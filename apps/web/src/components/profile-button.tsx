import { ChevronDown, LogOut } from "lucide-react";
import { auth } from "@/providers/auth-provider";
import { getInitials } from "@/utils/get-initials";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export async function ProfileButton() {
	const { user } = await auth();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="group flex cursor-pointer items-center gap-3 outline-none">
				<div className="flex flex-col items-end">
					<span className="font-medium text-sm">{user.name}</span>
					<span className="text-muted-foreground text-xs">{user.email}</span>
				</div>

				<Avatar className="size-8">
					{user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
					{user.name && (
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					)}
				</Avatar>

				<ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<a href="/api/auth/sign-out">
						<LogOut className="mr-2 size-4" />
						Sign out
					</a>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
