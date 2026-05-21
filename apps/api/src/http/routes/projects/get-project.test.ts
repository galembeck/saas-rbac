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

function makeProject(organizationId: string, ownerId: string) {
	return {
		id: faker.string.uuid(),
		name: "Test Project",
		description: "A test project",
		slug: "test-project",
		avatarUrl: null,
		organizationId,
		ownerId,
		owner: {
			id: ownerId,
			name: faker.person.fullName(),
			avatarUrl: null,
		},
	};
}

describe("GET /organizations/:orgSlug/projects/:projectSlug", () => {
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

	it("returns the project for an ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const project = makeProject(organization.id, faker.string.uuid());

		prismaMock.project.findUnique.mockResolvedValue(project);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects/${project.slug}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			project: {
				id: project.id,
				name: project.name,
				slug: project.slug,
				organizationId: organization.id,
			},
		});
	});

	it("returns the project for a MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const project = makeProject(organization.id, faker.string.uuid());

		prismaMock.project.findUnique.mockResolvedValue(project);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects/${project.slug}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
	});

	it("returns 401 UNAUTHORIZED when user is BILLING", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "BILLING");

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects/any-project`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 PROJECT_NOT_FOUND when project does not exist in the organization", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.project.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/projects/nonexistent-project`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "PROJECT_NOT_FOUND",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/organizations/some-org/projects/some-project",
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
