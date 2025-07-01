<script lang="ts">
	import {
		prepopulationState,
		prepopulationLinkStore,
		type PrefillFormFieldsType
	} from "@/data/prepopulation-link/store.svelte";
	import {
		emailMarketingTokenDocumentation,
		type EmailMarketingProviders
	} from "@/data/prepopulation-link/emailMarketingTokens";
	import { z } from "zod";

	// Accept form fields from parent component
	let { formFields = $bindable() }: { formFields: PrefillFormFieldsType[] } = $props();

	function updateFormFieldsToken(field: PrefillFormFieldsType, { custom = false } = {}) {
		const indexToUpdate = formFields.findIndex(
			(currentField) => currentField.formKey === field.formKey
		);

		// If no item found, just return without making any changes
		if (indexToUpdate === -1) return;

		// Validate number fields with Zod - but always allow updates
		let validatedToken = field.token;

		if (
			field.fieldType === "number" &&
			field.validation?.min !== undefined &&
			field.token.trim() !== ""
		) {
			const numberSchema = z.coerce.number().min(field.validation.min);
			const result = numberSchema.safeParse(field.token);
			if (result.success) {
				validatedToken = result.data.toString();
			} else {
				// For invalid numbers, don't include in URL but still update to uncheck
				validatedToken = "";
			}
		}

		// Auto-check prefill if token has content, uncheck if empty
		const shouldBePrefilled = validatedToken.trim() !== "";

		const updatedField: PrefillFormFieldsType = custom
			? {
					...formFields[indexToUpdate],
					token: validatedToken,
					formKey: field.formKey,
					prefilled: shouldBePrefilled
				}
			: {
					...formFields[indexToUpdate],
					token: validatedToken,
					prefilled: shouldBePrefilled
				};

		formFields[indexToUpdate] = updatedField;
	}

	// Get the next ID based on current maximum ID in the array
	const getNextID = () => {
		if (formFields.length === 0) return 1;
		return Math.max(...formFields.map((field) => field.id)) + 1;
	};

	function addExtraField() {
		const newField: PrefillFormFieldsType = {
			id: getNextID(),
			label: "Custom field",
			formKey: "",
			prefilled: true,
			token: ""
		};

		formFields.push(newField);
	}

	const selectedProvider = $derived(
		$prepopulationLinkStore.selectedEmailProvider as EmailMarketingProviders
	);
</script>

<section class="mt-6">
	<div class="flex items-center" style="column-gap: 1rem; padding-bottom: 1rem;">
		<p class="h5 mb-0">Customise the fields you want to prefill.</p>

		{#if $prepopulationLinkStore.selectedEmailProvider !== "Other"}
			<!-- TODO: make this button look good -->
			<button
				style="border: 1px solid black; padding: 0.5rem 1rem; cursor: pointer;"
				onclick={() => (prepopulationState.customiseFields = false)}
			>
				Hide ↑</button
			>
		{/if}
	</div>

	{#if $prepopulationLinkStore.selectedEmailProvider === "Other"}
		<p>Add the relevant token for each form field from your email marketing provider.</p>
	{/if}
	{#if emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology}
		<p>
			Make the prepopulation link using <em
				>{emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology}s</em
			>
			for data about your supporters in your <em>{selectedProvider}</em>
			database. Add the
			<em>{emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology}</em>
			for any other fields you like.
			<small
				><a href={emailMarketingTokenDocumentation[selectedProvider]?.link}
					>See the {selectedProvider} documentation</a
				></small
			>.
		</p>
	{/if}
	<table>
		<thead>
			<tr>
				<th>Prefill?</th>
				<!-- <th>Label</th> -->
				<th>Impact Stack Form Key</th>
				<th>
					{#if selectedProvider !== "Other"}
						{selectedProvider}
					{/if}
					{emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology || "Token"}</th
				>
			</tr>
		</thead>
		<tbody>
			{#each formFields as field (field.id)}
				<tr>
					<td>
						<input type="checkbox" bind:checked={field.prefilled} />
					</td>
					<!-- <td>
						{field.label}
					</td> -->
					<td>
						{#if field.label === "Custom field"}
							<input
								type="text"
								placeholder="Impact Stack form key"
								bind:value={field.formKey}
								onkeyup={(e) =>
									updateFormFieldsToken(
										{ ...field, formKey: (e.target as HTMLInputElement).value },
										{ custom: true }
									)}
								onchange={(e) =>
									updateFormFieldsToken(
										{ ...field, formKey: (e.target as HTMLInputElement).value },
										{ custom: true }
									)}
							/>
						{:else}
							{field.formKey}
						{/if}
					</td>
					<td>
						{#if field.fieldType === "select"}
							<select bind:value={field.token} onchange={() => updateFormFieldsToken(field)}>
								<option value="">Select interval</option>
								{#if field.options}
									{#each field.options as option, index}
										<option value={index === 0 ? "1" : index === 1 ? "m" : "y"}>
											{option}
										</option>
									{/each}
								{/if}
							</select>
						{:else}
							<input
								type={field.fieldType === "number" ? "number" : "text"}
								placeholder={field.fieldType === "number"
									? "Enter a number…"
									: emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology || "Token"}
								bind:value={field.token}
								onkeyup={(e) =>
									updateFormFieldsToken({
										...field,
										token: (e.target as HTMLInputElement).value
									})}
								onchange={(e) =>
									updateFormFieldsToken({
										...field,
										token: (e.target as HTMLInputElement).value
									})}
								oninput={(e) => {
									if (field.fieldType === "number" && field.validation?.min !== undefined) {
										const value = parseFloat(e.target.value);
										if (value < field.validation.min) {
											e.target.value = "";
											field.token = "";
										}
									}
								}}
								{...field.fieldType === "number" && field.validation?.min
									? { min: field.validation.min }
									: {}}
							/>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<section>
		<div>
			<button class="button tiny" onclick={addExtraField}>Add a field</button>
		</div>
	</section>
</section>

<style>
	input[type="checkbox"] {
		position: relative;
		transform: scale(1.5);
		cursor: pointer;
	}

	input[type="text"],
	select {
		margin-bottom: 0;
	}

	select {
		padding: 0.625rem;
		appearance: auto;
		-webkit-appearance: menulist;
		-moz-appearance: menulist;
	}
</style>
