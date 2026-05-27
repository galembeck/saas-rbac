import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/"],
	shims: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	noExternal: ["@repo/auth", "@repo/env"],
});
