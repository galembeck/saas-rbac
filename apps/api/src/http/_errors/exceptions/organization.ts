/** biome-ignore-all lint/style/noEnum: required by exception handler */

export enum OrganizationException {
	DOMAIN_ALREADY_IN_USE = "DOMAIN_ALREADY_IN_USE",
	USER_NOT_MEMBER = "USER_NOT_MEMBER",
	AUTOMATICALLY_ATTACHING_USERS = "AUTOMATICALLY_ATTACHING_USERS",
	MEMBER_ALREADY_EXISTS = "MEMBER_ALREADY_EXISTS",
}
