import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "../../create-project/~actions/actions";

interface DeleteProjectButtonProps {
	projectId: string;
}

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
	return (
		<form action={deleteProjectAction.bind(null, projectId)}>
			<Button size="icon" variant="destructive">
				<Trash2 className="size-4" />
			</Button>
		</form>
	);
}
