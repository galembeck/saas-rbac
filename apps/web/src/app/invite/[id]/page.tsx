import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowLeft, CheckCircle, LogIn, LogOut } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/api/http/services/accept-invite";
import { getInvite } from "@/api/http/services/get-invite";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { auth, isAuthenticated } from "@/providers/auth-provider";
import { getInitials } from "@/utils/get-initials";

dayjs.extend(relativeTime);

interface InvitePageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function InvitePage({ params }: InvitePageProps) {
	const { id: inviteId } = await params;

	const { invite } = await getInvite(inviteId);

	const isUserAuthenticated = await isAuthenticated();

	// biome-ignore lint/suspicious/noEvolvingTypes: necessary in this case
	let currentUserEmail = null;

	if (isUserAuthenticated) {
		const { user } = await auth();

		currentUserEmail = user.email;
	}

	const userIsAuthenticatedWithSameEmailFromInvite =
		currentUserEmail === invite.email;

	async function signInFromInvite() {
		"use server";

		(await cookies()).set("inviteId", inviteId);

		redirect(`/auth/sign-in?email=${invite.email}`);
	}

	async function acceptInviteAction() {
		"use server";

		await acceptInvite(inviteId);

		redirect("/");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="flex w-full max-w-sm flex-col justify-center space-y-6">
				<div className="flex flex-col items-center space-y-4">
					<Avatar className="size-16">
						{invite.author?.avatarUrl && (
							<AvatarImage src={invite.author.avatarUrl} />
						)}

						{invite.author?.name && (
							<AvatarFallback>
								{getInitials(invite.author?.name)}
							</AvatarFallback>
						)}
					</Avatar>

					<p className="text-balance text-center text-muted-foreground leading-relaxed">
						<span className="font-medium text-foreground">
							{invite.author?.name ?? "Someone"}
						</span>{" "}
						invited you to join{" "}
						<span className="font-medium text-foreground">
							{invite.organization.name}
						</span>
						.{" "}
						<span className="text-xs">{dayjs(invite.createdAt).fromNow()}</span>
					</p>
				</div>

				<Separator />

				{!isUserAuthenticated && (
					<form action={signInFromInvite}>
						<Button className="w-full" type="submit" variant="secondary">
							<LogIn className="mr-2 size-4" />
							Sign in to accept invite
						</Button>
					</form>
				)}

				{userIsAuthenticatedWithSameEmailFromInvite && (
					<form action={acceptInviteAction}>
						<Button className="w-full" type="submit">
							<CheckCircle className="mr-2 size-4" />
							Join {invite.organization.name}
						</Button>
					</form>
				)}

				{isUserAuthenticated && !userIsAuthenticatedWithSameEmailFromInvite && (
					<div className="space-y-8">
						<p className="text-balance text-center text-muted-foreground text-sm leading-relaxed">
							This invite was sent to{" "}
							<span className="text-foreground text-medium">
								{invite.email}
							</span>{" "}
							but you are currently signed in as{" "}
							<span className="text-foreground text-medium">
								{currentUserEmail}
							</span>
							.
						</p>

						<div className="flex items-center justify-center gap-2">
							<Button asChild variant="secondary">
								<a href="/api/auth/sign-out">
									<LogOut className="mr-2 size-4" />
									Sign out
								</a>
							</Button>

							<Button asChild variant="outline">
								<Link href="/">
									<ArrowLeft className="mr-2 size-4" />
									Back to dashboard
								</Link>
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
