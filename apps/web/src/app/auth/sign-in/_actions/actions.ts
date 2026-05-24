/** biome-ignore-all lint/suspicious/useAwait: required by server actions */

"use server";

import { HTTPError } from "ky";
import { cookies } from "next/headers";
import { z } from "zod";
import { signInWithPassword } from "@/api/http/services/sign-in-with-password";

const signInSchema = z.object({
	email: z.email({ message: "Please, provide a valid e-mail address" }),
	password: z.string().min(1, { message: "The password is required" }),
});

export async function signInWithEmailAndPassword(data: FormData) {
	const result = signInSchema.safeParse(Object.fromEntries(data));

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;

		return { success: false, title: null, description: null, errors };
	}

	const { email, password } = result.data;

	try {
		const { accessToken } = await signInWithPassword({
			email,
			password,
		});

		(await cookies()).set("accessToken", accessToken, {
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		});
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

	return { success: true, title: null, description: null, errors: null };
}
