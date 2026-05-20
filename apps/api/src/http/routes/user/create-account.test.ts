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
import { prismaMock, resetPrismaMocks } from "../../../test/mocks/prisma.js";

vi.mock("@/lib/prisma", async () => {
	const { prismaMock } = await import("../../../test/mocks/prisma.js");
	return { prisma: prismaMock };
});

describe("POST /users", () => {
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

	it("creates account and returns 201", async () => {
		prismaMock.user.findUnique.mockResolvedValue(null);
		prismaMock.organization.findFirst.mockResolvedValue(null);
		prismaMock.user.create.mockResolvedValue({ id: faker.string.uuid() });

		const response = await app.inject({
			method: "POST",
			url: "/users",
			body: {
				name: faker.person.fullName(),
				email: faker.internet.email(),
				password: "secret123",
			},
		});

		expect(response.statusCode).toBe(201);
	});

	it("auto-joins organization when domain matches", async () => {
		const domain = "acme.com";
		const org = {
			id: faker.string.uuid(),
			name: "Acme",
			slug: "acme",
			domain,
			shouldAttachUsersByDomain: true,
		};

		prismaMock.user.findUnique.mockResolvedValue(null);
		prismaMock.organization.findFirst.mockResolvedValue(org);
		prismaMock.user.create.mockResolvedValue({ id: faker.string.uuid() });

		const response = await app.inject({
			method: "POST",
			url: "/users",
			body: {
				name: faker.person.fullName(),
				email: `user@${domain}`,
				password: "secret123",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(prismaMock.user.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					member_on: expect.objectContaining({ create: expect.any(Object) }),
				}),
			})
		);
	});

	it("returns 400 EMAIL_ALREADY_REGISTERED when email is taken", async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			id: faker.string.uuid(),
			email: "taken@example.com",
		});

		const response = await app.inject({
			method: "POST",
			url: "/users",
			body: {
				name: faker.person.fullName(),
				email: "taken@example.com",
				password: "secret123",
			},
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "EMAIL_ALREADY_REGISTERED",
		});
	});

	it("returns 400 validation error when name is missing", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/users",
			body: { email: faker.internet.email(), password: "secret123" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "Validation error",
		});
	});
});
