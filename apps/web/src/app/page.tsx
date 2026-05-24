import { auth } from "@/providers/auth-provider";

export default async function Home() {
	const { user } = await auth();

	return <pre>{JSON.stringify(user, null, 2)}</pre>;
}
