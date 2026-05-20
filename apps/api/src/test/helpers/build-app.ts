import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { fastify } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { errorHandler } from "@/http/error-handler";
import { authenticateWithGithubRoute } from "@/http/routes/auth/authenticate-with-github";
import { authenticateWithPasswordRoute } from "@/http/routes/auth/authenticate-with-password";
import { requestPasswordRecoveryRoute } from "@/http/routes/auth/request-password-recovery";
import { resetPasswordRoute } from "@/http/routes/auth/reset-password";
import { createOrganizationRoute } from "@/http/routes/orgs/create-organization";
import { deleteOrganizationRoute } from "@/http/routes/orgs/delete-organization";
import { getMembershipRoute } from "@/http/routes/orgs/get-membership";
import { getOrganizationRoute } from "@/http/routes/orgs/get-organization";
import { getOrganizationsRoute } from "@/http/routes/orgs/get-organizations";
import { transferOwnershipRoute } from "@/http/routes/orgs/transfer-ownership";
import { updateOrganizationRoute } from "@/http/routes/orgs/update-organization";
import { createProjectRoute } from "@/http/routes/projects/create-project";
import { deleteProjectRoute } from "@/http/routes/projects/delete-project";
import { createAccountRoute } from "@/http/routes/user/create-account";
import { getProfileRoute } from "@/http/routes/user/get-profile";

export async function buildApp() {
	const app = fastify().withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);
	app.setErrorHandler(errorHandler);

	await app.register(fastifyJwt, {
		secret: process.env.JWT_SECRET ?? "test-secret",
	});
	await app.register(fastifyCors);

	await app.register(createAccountRoute);
	await app.register(authenticateWithPasswordRoute);
	await app.register(authenticateWithGithubRoute);
	await app.register(requestPasswordRecoveryRoute);
	await app.register(resetPasswordRoute);
	await app.register(getProfileRoute);
	await app.register(createOrganizationRoute);
	await app.register(getMembershipRoute);
	await app.register(getOrganizationRoute);
	await app.register(getOrganizationsRoute);
	await app.register(updateOrganizationRoute);
	await app.register(deleteOrganizationRoute);
	await app.register(transferOwnershipRoute);
	await app.register(createProjectRoute);
	await app.register(deleteProjectRoute);

	await app.ready();

	return app;
}
