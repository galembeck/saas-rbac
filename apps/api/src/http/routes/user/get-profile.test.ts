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
import { signToken } from "@/test/helpers/sign-token";
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma.js";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma.js");
	return { prisma: prismaMock };
});

describe("GET /users/profile", () => {
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

	it("returns the authenticated user profile", async () => {
		const userId = faker.string.uuid();
		const user = {
			id: userId,
			name: faker.person.fullName(),
			email: faker.internet.email(),
			avatarUrl: null,
		};

		prismaMock.user.findUnique.mockResolvedValue(user);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: "/users/profile",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			user: { id: userId, email: user.email },
		});
	});

	it("returns 401 INVALID_TOKEN when no Authorization header is provided", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/users/profile",
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});

	it("returns 404 USER_NOT_FOUND when user was deleted after token was issued", async () => {
		const userId = faker.string.uuid();

		prismaMock.user.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: "/users/profile",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(404);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "USER_NOT_FOUND",
		});
	});
});
