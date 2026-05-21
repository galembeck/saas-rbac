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

function makeMember(_organizationId: string) {
	const userId = faker.string.uuid();
	return {
		id: faker.string.uuid(),
		role: "MEMBER" as const,
		user: {
			id: userId,
			name: faker.person.fullName(),
			email: faker.internet.email(),
			avatarUrl: null,
		},
	};
}

describe("GET /organizations/:slug/members", () => {
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

	it("returns members list for ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "ADMIN");
		const members = [makeMember(organization.id), makeMember(organization.id)];

		prismaMock.member.findMany.mockResolvedValue(members);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/members`,
			headers: { Authorization: `Bearer ${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			members: expect.arrayContaining([
				expect.objectContaining({ userId: members[0]?.user.id }),
				expect.objectContaining({ userId: members[1]?.user.id }),
			]),
		});
	});

	it("returns members list for MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const members = [makeMember(organization.id)];

		prismaMock.member.findMany.mockResolvedValue(members);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "GET",
			url: `/organizations/${organization.slug}/members`,
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
			url: `/organizations/${organization.slug}/members`,
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
			url: "/organizations/some-org/members",
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
