import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@repo/env";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter, log: ["query"] });
