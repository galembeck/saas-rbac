/** biome-ignore-all lint/style/noEnum: required by exception handler */

export enum AuthException {
	INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
	GITHUB_NO_EMAIL = "GITHUB_NO_EMAIL",
	USER_HAS_NO_PASSWORD = "USER_HAS_NO_PASSWORD",
	INVALID_TOKEN = "INVALID_TOKEN",
	UNAUTHORIZED = "UNAUTHORIZED",
}
