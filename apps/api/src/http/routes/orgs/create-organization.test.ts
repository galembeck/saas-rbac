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

describe("POST /organizations", () => {
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

	it("creates an organization without domain and returns 201", async () => {
		const userId = faker.string.uuid();
		const orgId = faker.string.uuid();

		prismaMock.organization.create.mockResolvedValue({ id: orgId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: "/organizations",
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Acme Corp" },
		});

		expect(response.statusCode).toBe(201);
		expect(JSON.parse(response.body)).toMatchObject({ organizationId: orgId });
	});

	it("creates an organization with an available domain", async () => {
		const userId = faker.string.uuid();
		const orgId = faker.string.uuid();

		prismaMock.organization.findUnique.mockResolvedValue(null);
		prismaMock.organization.create.mockResolvedValue({ id: orgId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: "/organizations",
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Acme Corp", domain: "acme.com" },
		});

		expect(response.statusCode).toBe(201);
	});

	it("returns 400 DOMAIN_ALREADY_IN_USE when domain is taken", async () => {
		const userId = faker.string.uuid();

		prismaMock.organization.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			domain: "acme.com",
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: "/organizations",
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Acme Corp", domain: "acme.com" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "DOMAIN_ALREADY_IN_USE",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/organizations",
			body: { name: "Acme Corp" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
