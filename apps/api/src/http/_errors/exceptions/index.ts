import type { AuthException } from "./auth";
import type { BusinessException } from "./business/business";
import type { OrganizationException } from "./organization";
import type { ProjectException } from "./project";
import type { UserException } from "./user";

export type AppException =
	| AuthException
	| OrganizationException
	| UserException
	| ProjectException
	| BusinessException;
