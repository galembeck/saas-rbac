import { vi } from "vitest";

export const prismaMock = {
	user: {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	organization: {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		findMany: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	member: {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	project: {
		findUnique: vi.fn(),
		findFirst: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
	token: {
		findUnique: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	},
	account: {
		findUnique: vi.fn(),
		create: vi.fn(),
	},
	$transaction: vi.fn(),
};

export function resetPrismaMocks() {
	for (const delegate of Object.values(prismaMock)) {
		if (typeof delegate === "object" && delegate !== null) {
			for (const fn of Object.values(delegate)) {
				if (typeof fn === "function" && "mockReset" in fn) {
					(fn as ReturnType<typeof vi.fn>).mockReset();
				}
			}
		} else if (typeof delegate === "function" && "mockReset" in delegate) {
			(delegate as ReturnType<typeof vi.fn>).mockReset();
		}
	}
}
