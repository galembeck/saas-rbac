import { type SubmitEvent, useState, useTransition } from "react";
import { requestFormReset } from "react-dom";

interface FormState {
	description: string | null;
	errors: Record<string, string[]> | null;
	success: boolean;
	title: string | null;
}

export function useFormState(
	action: (data: FormData) => Promise<FormState>,
	onSuccess?: () => Promise<void> | void,
	initialState?: FormState
) {
	const [isPending, startTransition] = useTransition();

	const [formState, setFormState] = useState(
		initialState ?? {
			description: null,
			errors: null,
			success: false,
			title: null,
		}
	);

	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const form = event.currentTarget;
		const data = new FormData(form);

		startTransition(async () => {
			const result = await action(data);

			if (result.success === true && onSuccess) {
				await onSuccess();
			}

			setFormState(result);
		});

		requestFormReset(form);
	}

	return [formState, handleSubmit, isPending] as const;
}
