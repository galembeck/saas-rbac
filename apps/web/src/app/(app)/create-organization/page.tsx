import { Header } from "@/components/header";
import { OrganizationForm } from "../org/~components/organization-form";

export default function CreateOrganizationPage() {
	return (
		<div className="space-y-4 py-4">
			<Header />

			<main className="mx-auto w-full max-w-300 space-y-4">
				<h1 className="font-semibold text-2xl">Create organization</h1>

				<OrganizationForm />
			</main>
		</div>
	);
}
