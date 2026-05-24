/** biome-ignore-all lint/suspicious/useAwait: required by server actions */

"use server";

import { HTTPError } from "ky";
import { cookies } from "next/headers";
import { z } from "zod";
import { signInWithPassword } from "@/api/http/services/sign-in-with-password";
import { signUp } from "@/api/http/services/sign-up";

const signUpSchema = z
	.object({
		name: z.string().refine((value) => value.split(" ").length > 1, {
			message: "Please, provide your full name",
		}),
		email: z.email({ message: "Please, provide a valid e-mail address" }),
		password: z
			.string()
			.min(6, { message: "The password should have at least 6 characters" }),
		password_confirmation: z.string(),
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: "Password confirmation does not match",
		path: ["password_confirmation"],
	});

export async function signUpAction(data: FormData) {
	const result = signUpSchema.safeParse(Object.fromEntries(data));

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;

		return { success: false, title: null, description: null, errors };
	}

	const { name, email, password } = result.data;

	try {
		await signUp({ name, email, password });

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
