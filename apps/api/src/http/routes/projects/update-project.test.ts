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

describe("PUT /organizations/:slug/projects/:projectId", () => {
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

	it("updates the project when user is ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const projectId = faker.string.uuid();

		prismaMock.project.findUnique.mockResolvedValue({
			id: projectId,
			organizationId: organization.id,
			ownerId: faker.string.uuid(),
		});
		prismaMock.project.update.mockResolvedValue({ id: projectId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/projects/${projectId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("updates the project when MEMBER owns it", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const projectId = faker.string.uuid();

		prismaMock.project.findUnique.mockResolvedValue({
			id: projectId,
			organizationId: organization.id,
			ownerId: userId,
		});
		prismaMock.project.update.mockResolvedValue({ id: projectId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/projects/${projectId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 401 UNAUTHORIZED when MEMBER does not own the project", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const projectId = faker.string.uuid();

		prismaMock.project.findUnique.mockResolvedValue({
			id: projectId,
			organizationId: organization.id,
			ownerId: faker.string.uuid(),
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/projects/${projectId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 401 UNAUTHORIZED when user is BILLING", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "BILLING");
		const projectId = faker.string.uuid();

		prismaMock.project.findUnique.mockResolvedValue({
			id: projectId,
			organizationId: organization.id,
			ownerId: faker.string.uuid(),
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/projects/${projectId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 NOT_FOUND when project does not exist in the organization", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.project.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/projects/${faker.string.uuid()}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "PUT",
			url: `/organizations/some-org/projects/${faker.string.uuid()}`,
			body: { name: "Updated Name", description: "Updated description" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
