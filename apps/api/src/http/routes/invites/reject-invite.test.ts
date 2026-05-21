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

describe("POST /invites/:inviteId/reject", () => {
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

	it("returns 204 when invite is rejected successfully", async () => {
		const userId = faker.string.uuid();
		const email = faker.internet.email();
		const inviteId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.invite.findUnique.mockResolvedValue({
			id: inviteId,
			email,
			role: "MEMBER" as const,
			organizationId: faker.string.uuid(),
			authorId: faker.string.uuid(),
			createdAt: new Date(),
		});
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
		prismaMock.invite.delete.mockResolvedValue({} as never);

		const response = await app.inject({
			method: "POST",
			url: `/invites/${inviteId}/reject`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 400 NOT_FOUND_OR_EXPIRED when invite does not exist", async () => {
		const userId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.invite.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: `/invites/${faker.string.uuid()}/reject`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND_OR_EXPIRED",
		});
	});

	it("returns 400 NOT_FOUND when authenticated user does not exist", async () => {
		const userId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.invite.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email: faker.internet.email(),
			role: "MEMBER" as const,
			organizationId: faker.string.uuid(),
			authorId: faker.string.uuid(),
			createdAt: new Date(),
		});
		prismaMock.user.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "POST",
			url: `/invites/${faker.string.uuid()}/reject`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND",
		});
	});

	it("returns 400 BELONGS_TO_OTHER_USER when invite email does not match user email", async () => {
		const userId = faker.string.uuid();
		const token = signToken(app, userId);

		prismaMock.invite.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email: "invite@example.com",
			role: "MEMBER" as const,
			organizationId: faker.string.uuid(),
			authorId: faker.string.uuid(),
			createdAt: new Date(),
		});
		prismaMock.user.findUnique.mockResolvedValue({
			id: userId,
			email: "different@example.com",
			name: faker.person.fullName(),
			avatarUrl: null,
			passwordHash: null,
			githubId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const response = await app.inject({
			method: "POST",
			url: `/invites/${faker.string.uuid()}/reject`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "BELONGS_TO_OTHER_USER",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "POST",
			url: `/invites/${faker.string.uuid()}/reject`,
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
