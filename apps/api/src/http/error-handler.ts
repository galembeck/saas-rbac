import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import { BadRequestError } from "./routes/_errors/bad-request-error";
import { NotFoundError } from "./routes/_errors/not-found-error";
import { UnauthorizedError } from "./routes/_errors/unauthorized-error";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

// biome-ignore lint/correctness/noUnusedFunctionParameters: required by @fastify error handler signature
export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
	if (error instanceof ZodError) {
		return reply.status(400).send({
			message: "Validation error",
			errors: z.treeifyError(error),
		});
	}

	if (error instanceof BadRequestError) {
		return reply.status(400).send({
			statusCode: 400,
			title: error.title,
			message: error.code,
			description: error.description,
		});
	}

	if (error instanceof UnauthorizedError) {
		return reply.status(401).send({
			statusCode: 401,
			title: error.title,
			message: error.code,
			description: error.description,
		});
	}

	if (error instanceof NotFoundError) {
		return reply.status(404).send({
			statusCode: 404,
			title: error.title,
			message: error.code,
			description: error.description,
		});
	}

	return reply.status(500).send({ message: "Internal server error." });
};
