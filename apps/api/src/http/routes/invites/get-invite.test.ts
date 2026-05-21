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
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma");
	return { prisma: prismaMock };
});

describe("GET /invites/:inviteId", () => {
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

	it("returns invite details when invite exists", async () => {
		const inviteId = faker.string.uuid();
		const invite = {
			id: inviteId,
			email: faker.internet.email(),
			role: "MEMBER" as const,
			createdAt: new Date(),
			author: {
				id: faker.string.uuid(),
				name: faker.person.fullName(),
				avatarUrl: faker.internet.url(),
			},
			organization: {
				name: faker.company.name(),
			},
		};

		prismaMock.invite.findUnique.mockResolvedValue(invite);

		const response = await app.inject({
			method: "GET",
			url: `/invites/${inviteId}`,
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			invite: {
				id: inviteId,
				email: invite.email,
				role: invite.role,
				organization: { name: invite.organization.name },
				author: {
					id: invite.author.id,
					name: invite.author.name,
					avatarUrl: invite.author.avatarUrl,
				},
			},
		});
	});

	it("returns invite details with null author when invite has no author", async () => {
		const inviteId = faker.string.uuid();
		const invite = {
			id: inviteId,
			email: faker.internet.email(),
			role: "ADMIN" as const,
			createdAt: new Date(),
			author: null,
			organization: {
				name: faker.company.name(),
			},
		};

		prismaMock.invite.findUnique.mockResolvedValue(invite);

		const response = await app.inject({
			method: "GET",
			url: `/invites/${inviteId}`,
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toMatchObject({
			invite: {
				id: inviteId,
				author: null,
			},
		});
	});

	it("returns 400 NOT_FOUND when invite does not exist", async () => {
		prismaMock.invite.findUnique.mockResolvedValue(null);

		const response = await app.inject({
			method: "GET",
			url: `/invites/${faker.string.uuid()}`,
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "NOT_FOUND",
		});
	});

	it("returns 400 validation error when inviteId is not a valid UUID", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/invites/not-a-valid-uuid",
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "Validation error",
		});
	});
});
