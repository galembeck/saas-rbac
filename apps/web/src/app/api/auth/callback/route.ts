import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { signInWithGithub } from "@/api/http/services/sign-in-with-github";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;

	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(
			new URL("/auth/sign-in?error=missing_code", request.nextUrl.origin)
		);
	}

	try {
		const { accessToken } = await signInWithGithub({ code });

		(await cookies()).set("accessToken", accessToken, {
			path: "/",
			maxAge: 60 * 60 * 24 * 7,
		});

		return NextResponse.redirect(new URL("/", request.nextUrl.origin));
	} catch {
		return NextResponse.redirect(
			new URL("/auth/sign-in?error=github_auth_failed", request.nextUrl.origin)
		);
	}
}
