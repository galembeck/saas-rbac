import { Header } from "@/components/header";
import { Tabs } from "@/components/tabs";

export default function OrganizationLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<div className="pt-6">
				<Header />

				<Tabs />
			</div>

			<main className="mx-auto w-full max-w-300 py-4">{children}</main>
		</div>
	);
}
