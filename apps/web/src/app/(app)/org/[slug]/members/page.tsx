import { ability } from "@/providers/auth-provider";
import { Invites } from "./~components/invites";
import { MembersList } from "./~components/members-list";

export default async function MembersPage() {
	const permissions = await ability();

	return (
		<div className="space-y-4">
			<h1 className="font-semibold text-2xl">Project</h1>

			<div className="space-y-4">
				{permissions?.can("get", "Invite") && <Invites />}

				{permissions?.can("get", "User") && <MembersList />}
			</div>
		</div>
	);
}
