import "dotenv/config";
import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { fastifySwagger } from "@fastify/swagger";
import { env } from "@repo/env";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { errorHandler } from "./http/error-handler";
import { authenticateWithGithubRoute } from "./http/routes/auth/authenticate-with-github";
import { authenticateWithPasswordRoute } from "./http/routes/auth/authenticate-with-password";
import { requestPasswordRecoveryRoute } from "./http/routes/auth/request-password-recovery";
import { resetPasswordRoute } from "./http/routes/auth/reset-password";
import { acceptInviteRoute } from "./http/routes/invites/accept-invite";
import { createInviteRoute } from "./http/routes/invites/create-invite";
import { getInviteRoute } from "./http/routes/invites/get-invite";
import { getInvitesRoute } from "./http/routes/invites/get-invites";
import { getPendingInvitesRoute } from "./http/routes/invites/get-pending-invites";
import { rejectInviteRoute } from "./http/routes/invites/reject-invite";
import { revokeInviteRoute } from "./http/routes/invites/revoke-invite";
import { getMembersRoute } from "./http/routes/members/get-members";
import { removeMemberRoute } from "./http/routes/members/remove-member";
import { updateMemberRoute } from "./http/routes/members/update-member";
import { createOrganizationRoute } from "./http/routes/orgs/create-organization";
import { deleteOrganizationRoute } from "./http/routes/orgs/delete-organization";
import { getMembershipRoute } from "./http/routes/orgs/get-membership";
import { getOrganizationRoute } from "./http/routes/orgs/get-organization";
import { getOrganizationsRoute } from "./http/routes/orgs/get-organizations";
import { transferOwnershipRoute } from "./http/routes/orgs/transfer-ownership";
import { updateOrganizationRoute } from "./http/routes/orgs/update-organization";
import { createProjectRoute } from "./http/routes/projects/create-project";
import { deleteProjectRoute } from "./http/routes/projects/delete-project";
import { getProjectRoute } from "./http/routes/projects/get-project";
import { getProjectsRoute } from "./http/routes/projects/get-projects";
import { updateProjectRoute } from "./http/routes/projects/update-project";
import { createAccountRoute } from "./http/routes/user/create-account";
import { getProfileRoute } from "./http/routes/user/get-profile";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "SaaS RBAC | API",
			description: "Full-stack SaaS app with multi-tenant & RBAC.",
			version: "1.0.0",
		},
		servers: [],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	},
	transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
	configuration: {
		title: "SaaS RBAC | API",
		layout: "classic",
	},
});

app.register(fastifyJwt, {
	secret: env.JWT_SECRET ?? "",
});

app.register(fastifyCors);

app.register(createAccountRoute);
app.register(authenticateWithPasswordRoute);
app.register(authenticateWithGithubRoute);

app.register(requestPasswordRecoveryRoute);
app.register(resetPasswordRoute);

app.register(getProfileRoute);

app.register(createOrganizationRoute);
app.register(getMembershipRoute);
app.register(getOrganizationRoute);
app.register(getOrganizationsRoute);
app.register(updateOrganizationRoute);
app.register(deleteOrganizationRoute);
app.register(transferOwnershipRoute);

app.register(createProjectRoute);
app.register(deleteProjectRoute);
app.register(getProjectRoute);
app.register(getProjectsRoute);
app.register(updateProjectRoute);

app.register(getMembersRoute);
app.register(updateMemberRoute);
app.register(removeMemberRoute);

app.register(createInviteRoute);
app.register(getInviteRoute);
app.register(getInvitesRoute);
app.register(acceptInviteRoute);
app.register(rejectInviteRoute);
app.register(revokeInviteRoute);
app.register(getPendingInvitesRoute);

app.listen({ port: env.PORT }).then(() => {
	console.log(`🚀 | HTTP server running at http://localhost:${env.PORT}`);
	console.log(`📝 | Docs available at http://localhost:${env.PORT}/docs`);
});
