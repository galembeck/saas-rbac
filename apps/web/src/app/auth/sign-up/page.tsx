import { SignUpForm } from "./~components/sign-up-form";

interface SignUpPageProps {
	searchParams: Promise<{ error?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
	const { error } = await searchParams;

	return <SignUpForm githubError={error} />;
}
