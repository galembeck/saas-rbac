"use client";

import type { Role } from "@repo/rbac/src/types/role";
import type { ComponentProps } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { updateMemberAction } from "../~actions/actions";

interface UpdateMemberRoleSelectProps extends ComponentProps<typeof Select> {
	memberId: string;
}

export function UpdateMemberRoleSelect({
	memberId,
	...props
}: UpdateMemberRoleSelectProps) {
	async function updateMemberRole(role: Role) {
		await updateMemberAction(memberId, role);
	}

	return (
		<Select {...props} onValueChange={updateMemberRole}>
			<SelectTrigger className="h-8 w-32">
				<SelectValue />
			</SelectTrigger>

			<SelectContent>
				<SelectItem value="ADMIN">Admin</SelectItem>

				<SelectItem value="MEMBER">Member</SelectItem>

				<SelectItem value="BILLING">Billing</SelectItem>
			</SelectContent>
		</Select>
	);
}
