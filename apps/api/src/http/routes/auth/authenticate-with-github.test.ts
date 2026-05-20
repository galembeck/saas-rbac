import { faker } from "@faker-js/faker";
import {
	afterAll,
	afterEach,
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

const GITHUB_TOKEN_RESPONSE = {
	access_token: "gho_test_token",
	token_type: "bearer" as const,
	scope: "read:user",
};

function makeGithubUser(email: string | null = faker.internet.email()) {
	return {
		id: faker.number.int({ min: 1000, max: 99_999 }),
		avatar_url: `https://avatars.githubusercontent.com/u/${faker.number.int()}`,
		name: faker.person.fullName(),
		email,
	};
}

describe("POST /sessions/github", () => {
	let app: Awaited<ReturnType<typeof buildApp>>;
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeAll(async () => {
		app = await buildApp();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		resetPrismaMocks();
		fetchSpy = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it("creates a new user and returns access token", async () => {
		const githubUser = makeGithubUser();

		fetchSpy
			.mockResolvedValueOnce({
				json: async () => GITHUB_TOKEN_RESPONSE,
			} as Response)
			.mockResolvedValueOnce({ json: async () => githubUser } as Response);

		const newUser = {
			id: faker.string.uuid(),
			email: githubUser.email,
			name: githubUser.name,
			avatarUrl: githubUser.avatar_url,
		};

		prismaMock.user.findUnique.mockResolvedValue(null);
		prismaMock.user.create.mockResolvedValue(newUser);
		prismaMock.account.findUnique.mockResolvedValue(null);
		prismaMock.account.create.mockResolvedValue({
			id: faker.string.uuid(),
			provider: "GITHUB",
			providerAccountId: String(githubUser.id),
			userId: newUser.id,
		});

		const response = await app.inject({
			method: "POST",
			url: "/sessions/github",
			body: { code: "github-code-123" },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toHaveProperty("accessToken");
	});

	it("reuses existing user and account and returns access token", async () => {
		const githubUser = makeGithubUser();
		const existingUser = {
			id: faker.string.uuid(),
			email: githubUser.email,
			name: githubUser.name,
			avatarUrl: githubUser.avatar_url,
		};
		const existingAccount = {
			id: faker.string.uuid(),
			provider: "GITHUB",
			providerAccountId: String(githubUser.id),
			userId: existingUser.id,
		};

		fetchSpy
			.mockResolvedValueOnce({
				json: async () => GITHUB_TOKEN_RESPONSE,
			} as Response)
			.mockResolvedValueOnce({ json: async () => githubUser } as Response);

		prismaMock.user.findUnique.mockResolvedValue(existingUser);
		prismaMock.account.findUnique.mockResolvedValue(existingAccount);

		const response = await app.inject({
			method: "POST",
			url: "/sessions/github",
			body: { code: "github-code-123" },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toHaveProperty("accessToken");
		expect(prismaMock.user.create).not.toHaveBeenCalled();
		expect(prismaMock.account.create).not.toHaveBeenCalled();
	});

	it("returns 400 GITHUB_NO_EMAIL when GitHub user has no email", async () => {
		const githubUser = makeGithubUser(null);

		fetchSpy
			.mockResolvedValueOnce({
				json: async () => GITHUB_TOKEN_RESPONSE,
			} as Response)
			.mockResolvedValueOnce({ json: async () => githubUser } as Response);

		const response = await app.inject({
			method: "POST",
			url: "/sessions/github",
			body: { code: "github-code-123" },
		});

		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body)).toMatchObject({
			message: "GITHUB_NO_EMAIL",
		});
	});
});
