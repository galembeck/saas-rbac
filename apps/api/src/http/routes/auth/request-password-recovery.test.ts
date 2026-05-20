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

describe("POST /password/recover", () => {
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

	it("creates a recovery token and returns 201", async () => {
		const user = { id: faker.string.uuid(), email: faker.internet.email() };

		prismaMock.user.findUnique.mockResolvedValue(user);
		prismaMock.token.create.mockResolvedValue({
			id: faker.string.uuid(),
			type: "PASSWORD_RECOVERY",
			userId: user.id,
		});

		const response = await app.inject({
			method: "POST",
			url: "/password/recover",
			body: { email: user.email },
		});

		expect(response.statusCode).toBe(201);
		expect(prismaMock.token.create).toHaveBeenCalledOnce();
	});

	it("returns 201 even when email does not exist (non-disclosure)", async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: "/password/recover",
			body: { email: faker.internet.email() },
		});

		expect(response.statusCode).toBe(201);
		expect(prismaMock.token.create).not.toHaveBeenCalled();
	});

	it("returns 400 validation error with invalid email format", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/password/recover",
			body: { email: "not-an-email" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "Validation error",
		});
	});
});
