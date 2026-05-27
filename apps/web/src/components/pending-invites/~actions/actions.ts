"use server";

import { revalidateTag } from "next/cache";
import { acceptInvite } from "@/api/http/services/accept-invite";
import { rejectInvite } from "@/api/http/services/reject-invite";

export async function acceptInviteAction(inviteId: string) {
	await acceptInvite(inviteId);

	revalidateTag("organizations", "max");
}

export async function rejectInviteAction(inviteId: string) {
	await rejectInvite(inviteId);

	revalidateTag("organizations", "max");
}
