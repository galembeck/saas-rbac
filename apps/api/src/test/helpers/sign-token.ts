import type { FastifyInstance } from "fastify";

export function signToken(app: FastifyInstance, userId: string): string {
	return app.jwt.sign({ sub: userId }, { expiresIn: "1h" });
}
