import { redirect } from "next/navigation";
import { isAuthenticated } from "@/providers/auth-provider";

export default function AppLayout({
	children,
	sheet,
}: Readonly<{
	children: React.ReactNode;
	sheet: React.ReactNode;
}>) {
	if (!isAuthenticated()) {
		redirect("/auth/sign-in");
	}

	return (
		<>
			{children}
			{sheet}
		</>
	);
}
