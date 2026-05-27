"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormState } from "@/hooks/use-form-state";
import { queryClient } from "@/lib/react-query";
import { createProjectAction } from "../~actions/actions";

export function ProjectForm() {
	const { orgSlug } = useParams<{ orgSlug: string }>();

	const [
		{ success, title, description, errors },
		handleSaveProject,
		isPending,
	] = useFormState(createProjectAction, () => {
		queryClient.invalidateQueries({
			queryKey: [orgSlug, "projects"],
		});
	});

	return (
		<form className="space-y-4" onSubmit={handleSaveProject}>
			{success === false && (title ?? description) && (
				<Alert variant="destructive">
					<AlertTriangle className="size-4" />

					<AlertTitle>{title ?? "Error while saving project!"}</AlertTitle>

					{description && (
						<AlertDescription>
							<p>{description}</p>
						</AlertDescription>
					)}
				</Alert>
			)}

			{success === true && (title ?? description) && (
				<Alert variant="success">
					<AlertTriangle className="size-4" />

					<AlertTitle>{title}</AlertTitle>

					{description && (
						<AlertDescription>
							<p>{description}</p>
						</AlertDescription>
					)}
				</Alert>
			)}

			<div className="space-y-3">
				<Label htmlFor="name">Project name</Label>

				<Input id="name" name="name" />

				{errors?.name && (
					<p className="font-medium text-red-500 text-xs dark:text-red-400">
						{errors.name[0]}
					</p>
				)}
			</div>

			<div className="space-y-3">
				<Label htmlFor="description">Description</Label>

				<Textarea id="description" name="description" />

				{errors?.description && (
					<p className="font-medium text-red-500 text-xs dark:text-red-400">
						{errors.description[0]}
					</p>
				)}
			</div>

			<Button className="w-full" disabled={isPending} type="submit">
				{isPending ? (
					<span className="flex items-center gap-2">
						<Loader2 className="size-4 animate-spin" />
						Saving...
					</span>
				) : (
					"Save project"
				)}
			</Button>
		</form>
	);
}
