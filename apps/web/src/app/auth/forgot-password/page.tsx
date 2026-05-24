import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
	return (
		<form action="" className="space-y-4">
			<div className="space-y-1">
				<Label htmlFor="email">E-mail</Label>

				<Input
					id="email"
					name="email"
					placeholder="your@email.com"
					type="email"
				/>
			</div>

			<Button className="w-full" type="submit">
				Recover password
			</Button>

			<Button asChild className="w-full" variant="link">
				<Link href="/auth/sign-in">
					<ArrowLeft className="mr-2 size-4" />
					Go back to sign in
				</Link>
			</Button>
		</form>
	);
}
