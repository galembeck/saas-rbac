import { redirect } from "next/navigation";
import { isAuthenticated } from "@/providers/auth-provider";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	if (await isAuthenticated()) {
		redirect("/");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="w-full max-w-xs">{children}</div>
		</div>
	);
}
