import { z } from "zod";
import { roleSchema } from "../types/role";

export const userSchema = z.object({
	id: z.string(),
	role: roleSchema,
});

export type User = z.infer<typeof userSchema>;
