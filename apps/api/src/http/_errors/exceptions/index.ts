import type { AuthException } from "./auth";
import type { BusinessException } from "./business/business";
import type { InviteException } from "./invite";
import type { OrganizationException } from "./organization";
import type { UserException } from "./user";

export type AppException =
	| AuthException
	| OrganizationException
	| UserException
	| BusinessException
	| InviteException;
