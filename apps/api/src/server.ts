import "dotenv/config";
import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { errorHandler } from "./http/error-handler";
import { authenticateWithPasswordRoute } from "./http/routes/auth/authenticate-with-password";
import { requestPasswordRecoveryRoute } from "./http/routes/auth/request-password-recovery";
import { resetPasswordRoute } from "./http/routes/auth/reset-password";
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
	},
	transform: jsonSchemaTransform,
});

app.register(ScalarApiReference, {
	routePrefix: "/docs",
	configuration: { title: "SaaS RBAC | API" },
});

app.register(fastifyJwt, {
	secret: process.env.JWT_SECRET ?? "",
});

app.register(fastifyCors);

app.register(createAccountRoute);
app.register(authenticateWithPasswordRoute);
app.register(requestPasswordRecoveryRoute);
app.register(resetPasswordRoute);

app.register(getProfileRoute);

const port = Number(process.env.PORT ?? 3333);

app.listen({ port }).then(() => {
	console.log(`🚀 | HTTP server running at http://localhost:${port}`);
	console.log(`📝 | Docs available at http://localhost:${port}/docs`);
});
