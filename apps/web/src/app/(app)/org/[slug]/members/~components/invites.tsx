import { getInvites } from "@/api/http/services/get-invites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ability, getCurrentOrganization } from "@/providers/auth-provider";
import { CreateInviteForm } from "./create-invite-form";
import { RevokeInviteButton } from "./revoke-invite-button";

export async function Invites() {
	const permissions = await ability();

	const currentOrganization = await getCurrentOrganization();

	// biome-ignore lint/style/noNonNullAssertion: always come as string
	const { invites } = await getInvites(currentOrganization!);

	return (
		<div className="space-y-4">
			{permissions?.can("create", "Invite") && (
				<Card>
					<CardHeader>
						<CardTitle>Invite member</CardTitle>
					</CardHeader>

					<CardContent>
						<CreateInviteForm />
					</CardContent>
				</Card>
			)}

			<div className="space-y-2">
				<h2 className="font-semibold text-lg">Invites</h2>

				<div className="rounded border">
					<Table>
						<TableBody>
							{invites.map((invite) => (
								<TableRow key={invite.id}>
									<TableCell className="py-2.5">
										<span className="text-muted-foreground">
											{invite.email}
										</span>
									</TableCell>

									<TableCell
										className="py-2.5 font-medium"
										style={{ width: 160 }}
									>
										{invite.role}
									</TableCell>

									<TableCell
										className="py-2.5 text-muted-foreground"
										style={{ width: 160 }}
									>
										{new Date(invite.createdAt).toLocaleDateString("pt-BR")}
									</TableCell>

									<TableCell
										className="py-2.5 text-right"
										style={{ width: 120 }}
									>
										<div className="flex justify-end">
											{permissions?.can("delete", "Invite") && (
												<RevokeInviteButton inviteId={invite.id} />
											)}
										</div>
									</TableCell>
								</TableRow>
							))}

							{invites.length === 0 && (
								<TableRow>
									<TableCell className="text-center text-muted-foreground">
										No invites found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
