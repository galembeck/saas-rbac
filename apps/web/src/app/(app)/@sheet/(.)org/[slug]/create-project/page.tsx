import { ProjectForm } from "@/app/(app)/org/[slug]/create-project/~components/project-form";
import { InterceptedSheetContent } from "@/components/intercepted-sheet-content";
import { Sheet, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function CreateProjectSheet() {
	return (
		<Sheet defaultOpen>
			<InterceptedSheetContent>
				<SheetHeader>
					<SheetTitle>Create project</SheetTitle>
				</SheetHeader>

				<div className="p-4 pt-0">
					<ProjectForm />
				</div>
			</InterceptedSheetContent>
		</Sheet>
	);
}
