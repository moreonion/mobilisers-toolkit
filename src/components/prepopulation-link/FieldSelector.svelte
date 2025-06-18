<script lang="ts">
	import {
		prepopulationState,
		prepopulationLinkStore,
		type PrefillFormFieldsType,
	} from "@/data/prepopulation-link/store.svelte";
	import { 
		emailMarketingTokenDocumentation,
		type EmailMarketingProviders 
	} from "@/data/prepopulation-link/emailMarketingTokens";

	// AI-NOTE: Accept form fields from parent component
	let { formFields = $bindable() }: { formFields: PrefillFormFieldsType[] } = $props();

	function updateFormFieldsToken(
		field: PrefillFormFieldsType,
		{ custom = false } = {}
	) {
		const indexToUpdate = formFields.findIndex(
			(currentField) => currentField.formKey === field.formKey
		);

		// If no item found, just return without making any changes
		if (indexToUpdate === -1) return;

		const updatedField: PrefillFormFieldsType = custom
			? {
					...formFields[indexToUpdate],
					token: field.token,
					formKey: field.formKey,
			  }
			: { ...formFields[indexToUpdate], token: field.token };

		formFields[indexToUpdate] = updatedField;
	}

	// AI-NOTE: Get the next ID based on current maximum ID in the array
	const getNextID = () => {
		if (formFields.length === 0) return 1;
		return Math.max(...formFields.map(field => field.id)) + 1;
	};

	function addExtraField() {
		const newField: PrefillFormFieldsType = {
			id: getNextID(),
			label: "Custom field",
			formKey: "",
			prefilled: true,
			token: "",
		};

		formFields.push(newField);
	}

	const selectedProvider = $derived(
		$prepopulationLinkStore.selectedEmailProvider as EmailMarketingProviders
	);
</script>

<section class="mt-6">
	<div
		class="flex items-center"
		style="column-gap: 1rem; padding-bottom: 1rem;"
	>
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
		<p>
			Add the relevant token for each form field from your email marketing
			provider.
		</p>
	{/if}
	{#if emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology}
		<p>
			Make the prepopulation link using <em
				>{emailMarketingTokenDocumentation[selectedProvider]
					?.tokenTerminology}s</em
			>
			for data about your supporters in your <em>{selectedProvider}</em>
			database. Add the
			<em
				>{emailMarketingTokenDocumentation[selectedProvider]
					?.tokenTerminology}</em
			>
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
					{emailMarketingTokenDocumentation[selectedProvider]
						?.tokenTerminology || "Token"}</th
				>
			</tr>
		</thead>
		<tbody>
			{#each formFields as field (field.id)}
				<tr>
					<td>
						<input
							type="checkbox"
							bind:checked={field.prefilled}
						/>
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
								onkeyup={() => updateFormFieldsToken(field, { custom: true })}
							/>
						{:else}
							{field.formKey}
						{/if}
					</td>
					<td>
						<input
							type="text"
							placeholder={emailMarketingTokenDocumentation[selectedProvider]
								?.tokenTerminology || "Token"}
							bind:value={field.token}
							onkeyup={() => updateFormFieldsToken(field)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<section>
		<div>
			<button
				class="button tiny"
				onclick={addExtraField}>Add a field</button
			>
		</div>
	</section>
</section>

<style>
	input[type="checkbox"] {
		position: relative;
		transform: scale(1.5);
	}

	input[type="text"] {
		margin-bottom: 0;
	}
</style>
