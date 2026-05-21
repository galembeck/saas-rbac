/** biome-ignore-all lint/style/noEnum: required by exception handler */

export enum InviteException {
	INVITE_ALREADY_EXISTS = "INVITE_ALREADY_EXISTS",
	NOT_FOUND_OR_EXPIRED = "NOT_FOUND_OR_EXPIRED",
	BELONGS_TO_OTHER_USER = "BELONGS_TO_OTHER_USER",
}
