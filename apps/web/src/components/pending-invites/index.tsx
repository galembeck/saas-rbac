"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Check, UserPlus2, X } from "lucide-react";
import { useState } from "react";
import { getPendingInvites } from "@/api/http/services/get-pending-invites";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { acceptInviteAction, rejectInviteAction } from "./~actions/actions";

dayjs.extend(relativeTime);

export function PendingInvites() {
	const [isOpen, setIsOpen] = useState(false);

	const queryClient = useQueryClient();

	const { data } = useQuery({
		queryKey: ["pending-invites"],
		queryFn: getPendingInvites,
		enabled: isOpen,
	});

	async function handleAcceptInvite(inviteId: string) {
		await acceptInviteAction(inviteId);

		queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
	}

	async function handleRejectInvite(inviteId: string) {
		await rejectInviteAction(inviteId);

		queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
	}

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button className="border border-border" size="icon" variant="ghost">
					<UserPlus2 className="h-[1.2rem] w-[1.2rem]" />

					<span className="sr-only">Pending invites</span>
				</Button>
			</PopoverTrigger>

			<PopoverContent className="w-80 space-y-2">
				<span className="block font-medium text-sm">
					Pending invites ({data?.invites?.length ?? 0})
				</span>

				{data?.invites.length === 0 && (
					<p className="text-muted-foreground text-sm">No invites found :/</p>
				)}

				{data?.invites.map((invite) => (
					<div className="flex justify-between space-y-2" key={invite.id}>
						<p className="text-muted-foreground text-xs leading-relaxed">
							<span className="font-medium text-foreground">
								{invite.author?.name ?? "Someone"}
							</span>{" "}
							invited you to join{" "}
							<span className="font-medium text-foreground">
								{invite.organization.name}
							</span>{" "}
							{dayjs(invite.createdAt).fromNow()}
						</p>

						<div className="flex gap-1">
							<Button onClick={() => handleAcceptInvite(invite.id)} size="icon">
								<Check className="size-3" />
								<span className="sr-only">Accept</span>
							</Button>

							<Button
								onClick={() => handleRejectInvite(invite.id)}
								size="icon"
								variant="outline"
							>
								<X className="size-3" />
								<span className="sr-only">Reject</span>
							</Button>
						</div>
					</div>
				))}
			</PopoverContent>
		</Popover>
	);
}
