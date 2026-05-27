import { redirect } from "next/navigation";
import { deleteOrganization } from "@/api/http/services/delete-organization";
import { Button } from "@/components/ui/button";
import { getCurrentOrganization } from "@/providers/auth-provider";

export function DeleteOrganizationButton() {
	async function deleteOrganizationAction() {
		"use server";

		const currentOrganization = await getCurrentOrganization();

		// biome-ignore lint/style/noNonNullAssertion: will always come as a string
		await deleteOrganization({ organization: currentOrganization! });

		redirect("/");
	}

	return (
		<form action={deleteOrganizationAction}>
			<Button className="w-46" type="submit" variant="destructive">
				Delete organization
			</Button>
		</form>
	);
}
