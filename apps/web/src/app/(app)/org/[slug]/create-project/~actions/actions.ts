/** biome-ignore-all lint/suspicious/useAwait: required by server actions */

"use server";

import { HTTPError } from "ky";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createProject } from "@/api/http/services/create-project";
import { DeleteProject } from "@/api/http/services/delete-project";
import { getCurrentOrganization } from "@/providers/auth-provider";

const createProjectSchema = z.object({
	name: z.string().min(4, {
		message: "The project's name should have at least 4 characters",
	}),
	description: z.string(),
});

export async function createProjectAction(data: FormData) {
	const result = createProjectSchema.safeParse(Object.fromEntries(data));

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;

		return { success: false, title: null, description: null, errors };
	}

	const { name, description } = result.data;

	const currentOrganization = await getCurrentOrganization();

	try {
		await createProject({
			orgSlug: currentOrganization,
			name,
			description,
		});

		revalidateTag(`${currentOrganization}/projects`, "max");
	} catch (error) {
		if (error instanceof HTTPError) {
			const { title, description } = error.data as {
				title: string | null;
				description: string | null;
			};

			return {
				success: false,
				title,
				description,
				errors: null,
			};
		}

		return {
			success: false,
			title: "Unexpected error",
			description: "Try again in a few minutes.",
			errors: null,
		};
	}

	return {
		success: true,
		title: "Project saved!",
		description: "Successfully saved your project.",
		errors: null,
	};
}

export async function deleteProjectAction(projectId: string) {
	const currentOrganization = await getCurrentOrganization();

	await DeleteProject({
		projectId,
		// biome-ignore lint/style/noNonNullAssertion: always come as string
		organization: currentOrganization!,
	});

	revalidateTag(`${currentOrganization}/projects`, "max");
}
