import { api } from "../api-client";

interface SignUp {
	email: string;
	name: string;
	password: string;
}

export async function signUp({ name, email, password }: SignUp) {
	await api.post("users", {
		json: {
			name,
			email,
			password,
		},
	});
}
