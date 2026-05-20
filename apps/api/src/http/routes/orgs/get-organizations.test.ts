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

describe("GET /organizations", () => {
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

	it("returns organizations with user role", async () => {
		const userId = faker.string.uuid();

		prismaMock.organization.findMany.mockResolvedValue([
			{
				id: faker.string.uuid(),
				name: "Org One",
				slug: "org-one",
				avatarUrl: null,
				members: [{ role: "ADMIN" }],
			},
			{
				id: faker.string.uuid(),
				name: "Org Two",
				slug: "org-two",
				avatarUrl: null,
				members: [{ role: "MEMBER" }],
			},
		]);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: "/organizations",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.organizations).toHaveLength(2);
		expect(body.organizations[0]).toMatchObject({
			slug: "org-one",
			role: "ADMIN",
		});
		expect(body.organizations[1]).toMatchObject({
			slug: "org-two",
			role: "MEMBER",
		});
	});

	it("returns empty list when user has no organizations", async () => {
		const userId = faker.string.uuid();

		prismaMock.organization.findMany.mockResolvedValue([]);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: "/organizations",
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({ organizations: [] });
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/organizations",
		});

		expect(response.statusCode).toBe(401);
	});
});
