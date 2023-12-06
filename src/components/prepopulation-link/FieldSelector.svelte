<script lang="ts">
	import {
		customiseFields,
		prefillFormFields,
		prepopulationLinkStore,
	} from "@/data/prepopulation-link/store";
	import type { PrefillFormFieldsType } from "@/data/prepopulation-link/store";
	import {
		emailMarketingTokenDocumentation,
		type EmailMarketingProviders,
	} from "@/data/prepopulation-link/emailMarketingTokens";

	function updateFormFieldsToken(
		field: PrefillFormFieldsType,
		{ custom = false } = {}
	) {
		prefillFormFields.update((items) => {
			const indexToUpdate = items.findIndex(
				(currentField) => currentField.formKey === field.formKey
			);

			// If no item found, just return the original state of items without making any changes
			if (indexToUpdate === -1) return items;

			const updatedField: PrefillFormFieldsType = custom
				? {
						...items[indexToUpdate],
						token: field.token,
						formKey: field.formKey,
				  }
				: { ...items[indexToUpdate], token: field.token };

			items[indexToUpdate] = updatedField;

			return items;
		});
	}

	let lastID = $prefillFormFields.length;

	function addExtraField() {
		const newField: PrefillFormFieldsType = {
			id: ++lastID,
			label: "Custom field",
			formKey: "",
			prefilled: true,
			token: "",
		};

		prefillFormFields.update((items) => {
			return [...items, newField];
		});
	}

	$: selectedProvider =
		$prepopulationLinkStore.selectedEmailProvider as EmailMarketingProviders;
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
				on:click={() => ($customiseFields = false)}
			>
				Hide ↑</button
			>
		{/if}
	</div>

	{#if $prepopulationLinkStore.selectedEmailProvider === "Other"}
		<p>
			Add the <em>Token</em> for each form field from your email marketing provider.
		</p>
	{/if}
	{#if emailMarketingTokenDocumentation[selectedProvider]?.tokenTerminology}
		<p>
			You'll make your prepopulation link using the <em
				>{emailMarketingTokenDocumentation[selectedProvider]
					?.tokenTerminology}s</em
			>
			for your supporters in your <em>{selectedProvider}</em> database. Add the
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
			{#each $prefillFormFields as field (field.id)}
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
								on:keyup={() => updateFormFieldsToken(field, { custom: true })}
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
							on:keyup={() => updateFormFieldsToken(field)}
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
				on:click={addExtraField}>Add a field</button
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
