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
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma");
	return { prisma: prismaMock };
});

describe("GET /invites/pending", () => {
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

	it("returns 200 with pending invites for the authenticated user", async () => {
		const userId = faker.string.uuid();
		const email = faker.internet.email();
		const token = signToken(app, userId);

		prismaMock.user.findUnique.mockResolvedValue({
			id: userId,
			email,
			name: faker.person.fullName(),
			avatarUrl: null,
			passwordHash: null,
			githubId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const invites = [
			{
				id: faker.string.uuid(),
				email,
				role: "MEMBER" as const,
				createdAt: new Date(),
				organization: { name: faker.company.name() },
				author: {
					id: faker.string.uuid(),
					name: faker.person.fullName(),
					avatarUrl: faker.internet.url(),
				},
			},
			{
				id: faker.string.uuid(),
				email,
				role: "ADMIN" as const,
				createdAt: new Date(),
				organization: { name: faker.company.name() },
				author: null,
			},
		];

		prismaMock.invite.findMany.mockResolvedValue(invites);

		const response = await app.inject({
			method: "GET",
			url: "/invites/pending",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			invites: [
				{ id: invites[0]?.id, role: "MEMBER" },
				{ id: invites[1]?.id, role: "ADMIN", author: null },
			],
		});
	});

	it("returns 200 with empty array when user has no pending invites", async () => {
		const userId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.user.findUnique.mockResolvedValue({
			id: userId,
			email: faker.internet.email(),
			name: null,
			avatarUrl: null,
			passwordHash: null,
			githubId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		prismaMock.invite.findMany.mockResolvedValue([]);

		const response = await app.inject({
			method: "GET",
			url: "/invites/pending",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({ invites: [] });
	});

	it("returns 400 NOT_FOUND when authenticated user does not exist", async () => {
		const userId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.user.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "GET",
			url: "/invites/pending",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/invites/pending",
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
