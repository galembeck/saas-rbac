"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SheetOverlay, SheetPortal } from "./ui/sheet";

export function InterceptedSheetContent({
	className,
	children,
	side = "right",
	showCloseButton = true,
	...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left";
	showCloseButton?: boolean;
}) {
	const router = useRouter();

	function onDismiss() {
		router.back();
	}

	return (
		<SheetPortal>
			<SheetOverlay />
			<SheetPrimitive.Content
				className={cn(
					"data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10 fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-popover-foreground text-sm shadow-lg transition duration-200 ease-in-out data-[side=bottom]:inset-x-0 data-[side=top]:inset-x-0 data-[side=left]:inset-y-0 data-[side=right]:inset-y-0 data-[side=top]:top-0 data-[side=right]:right-0 data-[side=bottom]:bottom-0 data-[side=left]:left-0 data-[side=bottom]:h-auto data-[side=left]:h-full data-[side=right]:h-full data-[side=top]:h-auto data-[side=left]:w-3/4 data-[side=right]:w-3/4 data-closed:animate-out data-open:animate-in data-[side=bottom]:border-t data-[side=left]:border-r data-[side=top]:border-b data-[side=right]:border-l data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
					className
				)}
				data-side={side}
				data-slot="sheet-content"
				onEscapeKeyDown={onDismiss}
				onPointerDownOutside={onDismiss}
				{...props}
			>
				{children}
				{showCloseButton && (
					<Button
						className="absolute top-4 right-4"
						onClick={onDismiss}
						size="icon-sm"
						variant="ghost"
					>
						<XIcon />
						<span className="sr-only">Close</span>
					</Button>
				)}
			</SheetPrimitive.Content>
		</SheetPortal>
	);
}
