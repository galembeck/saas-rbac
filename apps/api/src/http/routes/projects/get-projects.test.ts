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
import { mockMembership } from "@/test/helpers/membership";
import { signToken } from "@/test/helpers/sign-token";
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma");
	return { prisma: prismaMock };
});

function makeProject(organizationId: string) {
	const ownerId = faker.string.uuid();
	return {
		id: faker.string.uuid(),
		name: faker.commerce.productName(),
		description: faker.lorem.sentence(),
		slug: faker.lorem.slug(),
		avatarUrl: null,
		organizationId,
		ownerId,
		createdAt: new Date(),
		owner: {
			id: ownerId,
			name: faker.person.fullName(),
			avatarUrl: null,
		},
	};
}

describe("GET /organizations/:slug/projects", () => {
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

	it("returns all projects in the organization for an ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const projects = [
			makeProject(organization.id),
			makeProject(organization.id),
		];

		prismaMock.project.findMany.mockResolvedValue(projects);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.projects).toHaveLength(2);
		expect(body.projects[0]).toMatchObject({
			id: projects[0]?.id,
			organizationId: organization.id,
		});
	});

	it("returns all projects in the organization for a MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const projects = [makeProject(organization.id)];

		prismaMock.project.findMany.mockResolvedValue(projects);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).projects).toHaveLength(1);
	});

	it("returns an empty list when the organization has no projects", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.project.findMany.mockResolvedValue([]);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({ projects: [] });
	});

	it("returns 401 UNAUTHORIZED when user is BILLING", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "BILLING");

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/organizations/some-org/projects",
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
