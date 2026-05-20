import type { AuthException } from "./auth";
import type { OrganizationException } from "./organization";
import type { UserException } from "./user";

export type AppException =
	| AuthException
	| OrganizationException
	| UserException;
