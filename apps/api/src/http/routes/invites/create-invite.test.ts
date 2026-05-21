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

describe("POST /organizations/:slug/invites", () => {
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

	it("creates an invite when user is ADMIN", async () => {
		const userId = faker.string.uuid();
		const { organization, membership } = mockMembership(userId, "ADMIN");
		const inviteId = faker.string.uuid();
		const email = faker.internet.email();

		// getUserMembership (call 1) then memberWithSameEmail check (call 2)
		prismaMock.member.findFirst
			.mockResolvedValueOnce({ ...membership, organization })
			.mockResolvedValueOnce(null);

		prismaMock.invite.findUnique.mockResolvedValue(null);
		prismaMock.invite.create.mockResolvedValue({ id: inviteId });

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email, role: "MEMBER" },
		});

		expect(response.statusCode).toBe(201);
		expect(JSON.parse(response.body)).toMatchObject({ inviteId });
	});

	it("returns 401 UNAUTHORIZED when user is MEMBER", async () => {
		const userId = faker.string.uuid();
		const { organization } = mockMembership(userId, "MEMBER");
		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email: faker.internet.email(), role: "MEMBER" },
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
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email: faker.internet.email(), role: "MEMBER" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "UNAUTHORIZED",
		});
	});

	it("returns 400 AUTOMATICALLY_ATTACHING_USERS when org auto-attaches by domain", async () => {
		const userId = faker.string.uuid();
		const { organization, membership } = mockMembership(userId, "ADMIN");
		const domain = "example.com";

		prismaMock.member.findFirst.mockResolvedValue({
			...membership,
			organization: {
				...organization,
				shouldAttachUsersByDomain: true,
				domain,
			},
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email: `user@${domain}`, role: "MEMBER" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "AUTOMATICALLY_ATTACHING_USERS",
		});
	});

	it("returns 400 INVITE_ALREADY_EXISTS when an invite for that email already exists", async () => {
		const userId = faker.string.uuid();
		const { organization, membership } = mockMembership(userId, "ADMIN");
		const email = faker.internet.email();

		prismaMock.member.findFirst.mockResolvedValueOnce({
			...membership,
			organization,
		});
		prismaMock.invite.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email,
			organizationId: organization.id,
		});

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email, role: "MEMBER" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVITE_ALREADY_EXISTS",
		});
	});

	it("returns 400 MEMBER_ALREADY_EXISTS when a member with that email already exists", async () => {
		const userId = faker.string.uuid();
		const { organization, membership } = mockMembership(userId, "ADMIN");
		const email = faker.internet.email();

		prismaMock.member.findFirst
			.mockResolvedValueOnce({ ...membership, organization })
			.mockResolvedValueOnce({
				id: faker.string.uuid(),
				organizationId: organization.id,
			});

		prismaMock.invite.findUnique.mockResolvedValue(null);

		const token = signToken(app, userId);

		const response = await app.inject({
			method: "POST",
			url: `/organizations/${organization.slug}/invites`,
			headers: { Authorization: `Bearer ${token}` },
			body: { email, role: "MEMBER" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "MEMBER_ALREADY_EXISTS",
		});
	});

	it("returns 401 INVALID_TOKEN when not authenticated", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/organizations/some-org/invites",
			body: { email: faker.internet.email(), role: "MEMBER" },
		});

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "INVALID_TOKEN",
		});
	});
});
