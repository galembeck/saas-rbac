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
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma.js";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma.js");
	return { prisma: prismaMock };
});

describe("PATCH /organizations/:slug/ownership", () => {
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

	it("transfers ownership when user is ADMIN and owner", async () => {
		const userId = faker.string.uuid();
		const targetUserId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.member.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			role: "MEMBER",
			organizationId: organization.id,
			userId: targetUserId,
		});
		prismaMock.$transaction.mockResolvedValue([]);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PATCH",
			url: `/organizations/${organization.slug}/ownership`,
			headers: { Authorization: `Bearer ${token}` },
			body: { transferToUserId: targetUserId },
		});

		expect(response.statusCode).toBe(204);
		expect(prismaMock.$transaction).toHaveBeenCalledOnce();
	});

	it("returns 401 UNAUTHORIZED when user is MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PATCH",
			url: `/organizations/${organization.slug}/ownership`,
			headers: { Authorization: `Bearer ${token}` },
			body: { transferToUserId: faker.string.uuid() },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 USER_NOT_MEMBER when target user is not in the organization", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.member.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PATCH",
			url: `/organizations/${organization.slug}/ownership`,
			headers: { Authorization: `Bearer ${token}` },
			body: { transferToUserId: faker.string.uuid() },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "USER_NOT_MEMBER",
		});
	});

	it("returns 401 UNAUTHORIZED when ADMIN does not own the organization", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		// Override ownerId to a different user
		prismaMock.member.findFirst.mockResolvedValue({
			id: faker.string.uuid(),
			role: "ADMIN",
			organizationId: organization.id,
			userId,
			organization: { ...organization, ownerId: faker.string.uuid() },
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PATCH",
			url: `/organizations/${organization.slug}/ownership`,
			headers: { Authorization: `Bearer ${token}` },
			body: { transferToUserId: faker.string.uuid() },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});
});
