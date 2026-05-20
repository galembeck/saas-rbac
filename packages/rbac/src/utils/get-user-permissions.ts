import { defineAbilityFor } from "..";
import { userSchema } from "../models/user.model";
import type { Role } from "../types/role";

export function getUserPermissions(userId: string, role: Role) {
	const authUser = userSchema.parse({
		id: userId,
		role,
	});

	const ability = defineAbilityFor(authUser);

	return ability;
}
