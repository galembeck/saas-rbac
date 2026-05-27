import { InterceptedSheetContent } from "@/components/intercepted-sheet-content";
import { Sheet, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { OrganizationForm } from "../../org/~components/organization-form";

export default function CreateOrganizationSheet() {
	return (
		<Sheet defaultOpen>
			<InterceptedSheetContent>
				<SheetHeader>
					<SheetTitle>Create organization</SheetTitle>
				</SheetHeader>

				<div className="p-4 pt-0">
					<OrganizationForm />
				</div>
			</InterceptedSheetContent>
		</Sheet>
	);
}
