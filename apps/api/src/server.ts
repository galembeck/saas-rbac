import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { fastify } from "fastify";
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { createAccountRoute } from "./http/routes/auth/create-account";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

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

app.register(fastifyCors);

app.register(createAccountRoute);

const port = Number(process.env.PORT ?? 3333);

app.listen({ port }).then(() => {
	console.log(`🚀 | HTTP server running at http://localhost:${port}`);
	console.log(`📝 | Docs available at http://localhost:${port}/docs`);
});
