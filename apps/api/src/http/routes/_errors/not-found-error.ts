import type { AppException } from "@/http/_errors/exceptions/index";

export class NotFoundError extends Error {
	title: string | null;
	code: AppException;
	description: string | null;

	constructor(
		title: string | null,
		code: AppException,
		description?: string | null
	) {
		super(code);
		this.title = title;
		this.code = code;
		this.description = description ?? null;
	}
}
