"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GithubIcon } from "@/components/icon/github-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFormState } from "@/hooks/use-form-state";
import { signInWithGithub } from "../../_actions/actions";
import { signInWithEmailAndPassword } from "../_actions/actions";

const githubErrorMessages: Record<string, string> = {
	missing_code: "GitHub OAuth code was missing or invalid.",
	github_auth_failed: "GitHub sign-in failed. Please try again.",
};

interface SignInFormProps {
	githubError?: string;
}

export function SignInForm({ githubError }: SignInFormProps) {
	const router = useRouter();

	const [{ success, title, description, errors }, handleSignIn, isPending] =
		useFormState(signInWithEmailAndPassword, () => {
			router.push("/");
		});

	return (
		<div className="space-y-4">
			{githubError && (
				<Alert variant="destructive">
					<AlertTriangle className="size-4" />
					<AlertTitle>Sign in failed!</AlertTitle>
					<AlertDescription>
						<p>
							{githubErrorMessages[githubError] ??
								"An unexpected error occurred."}
						</p>
					</AlertDescription>
				</Alert>
			)}

			<form className="space-y-4" onSubmit={handleSignIn}>
				{success === false && (title ?? description) && (
					<Alert variant="destructive">
						<AlertTriangle className="size-4" />

						<AlertTitle>{title ?? "Sign in failed!"}</AlertTitle>

						{description && (
							<AlertDescription>
								<p>{description}</p>
							</AlertDescription>
						)}
					</Alert>
				)}

				<div className="space-y-1">
					<Label htmlFor="email">E-mail</Label>

					<Input
						id="email"
						name="email"
						placeholder="your@email.com"
						type="email"
					/>

					{errors?.email && (
						<p className="font-medium text-red-500 text-xs dark:text-red-400">
							{errors.email[0]}
						</p>
					)}
				</div>

				<div className="space-y-1">
					<Label htmlFor="password">Password</Label>

					<Input
						id="password"
						name="password"
						placeholder="••••••"
						type="password"
					/>

					{errors?.password && (
						<p className="font-medium text-red-500 text-xs dark:text-red-400">
							{errors.password[0]}
						</p>
					)}

					<Link
						className="font-medium text-foreground text-xs hover:underline"
						href="/auth/forgot-password"
					>
						Forgot your password?
					</Link>
				</div>

				<Button className="w-full" disabled={isPending} type="submit">
					{isPending ? (
						<span className="flex items-center gap-2">
							<Loader2 className="size-4 animate-spin" />
							Signing in...
						</span>
					) : (
						"Sign in with e-mail"
					)}
				</Button>

				<Button asChild className="w-full" variant="link">
					<Link href="/auth/sign-up">Don't have an account? Sign up</Link>
				</Button>
			</form>

			<Separator />

			<form action={signInWithGithub}>
				<Button className="w-full" type="submit" variant="outline">
					<GithubIcon className="mr-2 size-4" />
					Sign in with Github
				</Button>
			</form>
		</div>
	);
}
