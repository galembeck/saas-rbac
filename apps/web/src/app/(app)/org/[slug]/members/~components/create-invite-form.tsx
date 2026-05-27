"use client";

import { AlertTriangle, Loader2, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFormState } from "@/hooks/use-form-state";
import { createInviteAction } from "../~actions/actions";

export function CreateInviteForm() {
	const [
		{ success, title, description, errors },
		handleCreateInvite,
		isPending,
	] = useFormState(createInviteAction);

	return (
		<form className="space-y-4" onSubmit={handleCreateInvite}>
			{success === false && (title ?? description) && (
				<Alert variant="destructive">
					<AlertTriangle className="size-4" />

					<AlertTitle>{title ?? "Error while inviting user!"}</AlertTitle>

					{description && (
						<AlertDescription>
							<p>{description}</p>
						</AlertDescription>
					)}
				</Alert>
			)}

			<div className="flex items-center gap-2">
				<div className="flex-1 space-y-3">
					<Input
						id="email"
						name="email"
						placeholder="user@email.com"
						type="email"
					/>

					{errors?.email && (
						<p className="font-medium text-red-500 text-xs dark:text-red-400">
							{errors.email[0]}
						</p>
					)}
				</div>

				<Select defaultValue="MEMBER" name="role">
					<SelectTrigger className="w-32">
						<SelectValue>Select</SelectValue>
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="ADMIN">Admin</SelectItem>

						<SelectItem value="MEMBER">Member</SelectItem>

						<SelectItem value="BILLING">Billing</SelectItem>
					</SelectContent>
				</Select>

				<Button disabled={isPending} type="submit">
					{isPending ? (
						<span className="flex items-center gap-2">
							<Loader2 className="size-4 animate-spin" />
							Sending...
						</span>
					) : (
						<span className="flex items-center gap-2">
							<UserPlus className="mr-2 size-4" />
							Send invite
						</span>
					)}
				</Button>
			</div>
		</form>
	);
}
