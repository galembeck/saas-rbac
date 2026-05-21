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

describe("PUT /organizations/:slug/members/:memberId", () => {
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

	it("updates the member role when user is ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const memberId = faker.string.uuid();

		prismaMock.member.findUnique.mockResolvedValue({
			id: memberId,
			organizationId: organization.id,
			userId: faker.string.uuid(),
			role: "MEMBER",
		});
		prismaMock.member.update.mockResolvedValue({ id: memberId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/members/${memberId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { role: "BILLING" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("updates the member role when user is MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const memberId = faker.string.uuid();

		prismaMock.member.findUnique.mockResolvedValue({
			id: memberId,
			organizationId: organization.id,
			userId: faker.string.uuid(),
			role: "BILLING",
		});
		prismaMock.member.update.mockResolvedValue({ id: memberId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/members/${memberId}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { role: "MEMBER" },
		});

		expect(response.statusCode).toBe(204);
	});

	it("returns 400 NOT_FOUND when member does not exist in the organization", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");

		prismaMock.member.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "PUT",
			url: `/organizations/${organization.slug}/members/${faker.string.uuid()}`,
			headers: { Authorization: `Bearer ${token}` },
			body: { role: "MEMBER" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({ message: "NOT_FOUND" });
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "PUT",
			url: `/organizations/some-org/members/${faker.string.uuid()}`,
			body: { role: "MEMBER" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
