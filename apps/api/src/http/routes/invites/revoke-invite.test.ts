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

describe("POST /organizations/:slug/invites/:inviteId", () => {
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

	it("returns 204 when ADMIN revokes an invite successfully", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const token = signToken(app, userId);
		const inviteId = faker.string.uuid();

		prismaMock.invite.findUnique.mockResolvedValue({
			id: inviteId,
			email: faker.internet.email(),
			role: "MEMBER" as const,
			organizationId: organization.id,
			authorId: faker.string.uuid(),
			createdAt: new Date(),
		});
		prismaMock.invite.delete.mockResolvedValue({} as never);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites/${inviteId}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 401 UNAUTHORIZED when user is MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites/${faker.string.uuid()}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 401 UNAUTHORIZED when user is BILLING", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "BILLING");
		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites/${faker.string.uuid()}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 NOT_FOUND when invite does not exist", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const token = signToken(app, userId);

		prismaMock.invite.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites/${faker.string.uuid()}`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "POST",
			url: `/organizations/some-org/invites/${faker.string.uuid()}`,
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
