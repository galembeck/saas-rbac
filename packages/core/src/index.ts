import {
	AbilityBuilder,
	type CreateAbility,
	createMongoAbility,
	type MongoAbility,
} from "@casl/ability";
import { z } from "zod";
import type { User } from "./models/user.model";
import { permissions } from "./permissions";
import { billingSubject } from "./subjects/billing.subject";
import { inviteSubject } from "./subjects/invite.subject";
import { organizationSubject } from "./subjects/organization.subject";
import { projectSubject } from "./subjects/project.subject";
import { userSubject } from "./subjects/user.subject";

const appAbilitiesSchema = z.union([
	billingSubject,
	inviteSubject,
	organizationSubject,
	projectSubject,
	userSubject,

	z.tuple([z.literal("manage"), z.literal("all")]),
]);

type AppAbilities = z.infer<typeof appAbilitiesSchema>;

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

export function defineAbilityFor(user: User): AppAbility {
	const builder = new AbilityBuilder<AppAbility>(createAppAbility);

	if (typeof permissions[user.role] !== "function") {
		throw new Error(`Permissions for role ${user.role} not found.`);
	}

	permissions[user.role](user, builder);

	const ability = builder.build({
		detectSubjectType(subject) {
			return subject.__typename;
		},
	});

	return ability;
}
