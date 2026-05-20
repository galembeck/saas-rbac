import { faker } from "@faker-js/faker";
import { hash } from "bcryptjs";
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

describe("POST /sessions/password", () => {
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

	it("returns access token with valid credentials", async () => {
		const password = "secret123";
		const passwordHash = await hash(password, 6);
		const user = {
			id: faker.string.uuid(),
			email: faker.internet.email(),
			passwordHash,
		};

		prismaMock.user.findUnique.mockResolvedValue(user);

		const response = await app.inject({
			method: "POST",
			url: "/sessions/password",
			body: { email: user.email, password },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toHaveProperty("accessToken");
	});

	it("returns 400 INVALID_CREDENTIALS when user is not found", async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: "/sessions/password",
			body: { email: faker.internet.email(), password: "any-password" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_CREDENTIALS",
		});
	});

	it("returns 400 USER_HAS_NO_PASSWORD for GitHub-only accounts", async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email: faker.internet.email(),
			passwordHash: null,
		});

		const response = await app.inject({
			method: "POST",
			url: "/sessions/password",
			body: { email: faker.internet.email(), password: "any-password" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "USER_HAS_NO_PASSWORD",
		});
	});

	it("returns 400 INVALID_CREDENTIALS when password does not match", async () => {
		const passwordHash = await hash("correct-password", 6);
		prismaMock.user.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email: faker.internet.email(),
			passwordHash,
		});

		const response = await app.inject({
			method: "POST",
			url: "/sessions/password",
			body: { email: faker.internet.email(), password: "wrong-password" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_CREDENTIALS",
		});
	});

	it("returns 400 validation error when email is missing", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/sessions/password",
			body: { password: "secret123" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "Validation error",
		});
	});
});
