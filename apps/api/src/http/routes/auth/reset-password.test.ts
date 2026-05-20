import { faker } from "@faker-js/faker";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { buildApp } from "@/test/helpers/build-app";
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma.js";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma.js");
	return { prisma: prismaMock };
});

describe("POST /password/reset", () => {
	let app: Awaited<ReturnType<typeof buildApp>>;

	beforeAll(async () => {
		app = await buildApp();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		resetPrismaMocks();
	});

	it("resets the password and returns 204", async () => {
		const userId = faker.string.uuid();
		const tokenId = faker.string.uuid();

		prismaMock.token.findUnique.mockResolvedValue({
			id: tokenId,
			type: "PASSWORD_RECOVERY",
			userId,
		});
		prismaMock.user.update.mockResolvedValue({ id: userId });

		const response = await app.inject({
			method: "POST",
			url: "/password/reset",
			body: { code: tokenId, password: "newpassword" },
		});

		expect(response.statusCode).toBe(204);
		expect(prismaMock.user.update).toHaveBeenCalledOnce();
	});

	it("returns 401 UNAUTHORIZED when code is not found", async () => {
		prismaMock.token.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: "/password/reset",
			body: { code: faker.string.uuid(), password: "newpassword" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 validation error when password is too short", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/password/reset",
			body: { code: faker.string.uuid(), password: "abc" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "Validation error",
		});
	});
});
