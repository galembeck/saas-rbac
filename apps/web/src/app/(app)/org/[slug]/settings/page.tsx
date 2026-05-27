import { getOrganization } from "@/api/http/services/get-organization";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ability, getCurrentOrganization } from "@/providers/auth-provider";
import { OrganizationForm } from "../../~components/organization-form";
import { Billing } from "./~components/billing";
import { DeleteOrganizationButton } from "./~components/delete-organization-button";

export default async function OrganizationSettingsPage() {
	const currentOrganization = await getCurrentOrganization();

	const permissions = await ability();

	const canUpdateOrganization = permissions?.can("update", "Organization");
	const canGetBillingDetails = permissions?.can("get", "Billing");

	const canDeleteOrganization = permissions?.can("delete", "Organization");

	// biome-ignore lint/style/noNonNullAssertion: always come as a string
	const { organization } = await getOrganization(currentOrganization!);

	return (
		<div className="space-y-4">
			<h1 className="font-semibold text-2xl">Settings</h1>

			<div className="space-y-4">
				{canUpdateOrganization && (
					<Card>
						<CardHeader>
							<CardTitle>Organization's settings</CardTitle>

							<CardDescription>
								Update your organization's settings/details.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<OrganizationForm
								initialData={{
									name: organization.name,
									domain: organization.domain,
									shouldAttachUsersByDomain:
										organization.shouldAttachUsersByDomain,
								}}
								isUpdating
							/>
						</CardContent>
					</Card>
				)}

				{canGetBillingDetails && <Billing />}

				{canDeleteOrganization && (
					<Card className="flex w-full flex-row items-center justify-between">
						<CardHeader className="w-full">
							<CardTitle>Delete organization</CardTitle>

							<CardDescription>
								This will delete all organization data including all projects.
								You cannot undo this action.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<DeleteOrganizationButton />
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
