<script lang="ts">
	import { prefillFormFields } from "@/data/prepopulation-link/store";
	import type { PrefillFormFieldsType } from "@/data/prepopulation-link/store";

	function updateFormFieldsTag(
		field: PrefillFormFieldsType,
		{ custom = false } = {}
	) {
		prefillFormFields.update((items) => {
			const indexToUpdate = items.findIndex(
				(currentField) => currentField.formKey === field.formKey
			);

			// If no item found, just return the original state of items without making any changes
			if (indexToUpdate === -1) return items;

			const updatedField = custom
				? { ...items[indexToUpdate], tag: field.tag, formKey: field.formKey }
				: { ...items[indexToUpdate], tag: field.tag };

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
			tag: "",
		};

		prefillFormFields.update((items) => {
			return [...items, newField];
		});
	}
</script>

<section>
	<p class="h5">Select the fields you want to prefill</p>
	<table>
		<thead>
			<tr>
				<th>Prefill?</th>
				<th>Label</th>
				<th>Form Key</th>
				<th>Tag</th>
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
					<td>
						{field.label}
					</td>
					<td>
						{#if field.label === "Custom field"}
							<input
								type="text"
								bind:value={field.formKey}
								on:keyup={() => updateFormFieldsTag(field, { custom: true })}
							/>
						{:else}
							{field.formKey}
						{/if}
					</td>
					<td>
						<input
							type="text"
							bind:value={field.tag}
							on:keyup={() => updateFormFieldsTag(field)}
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
	}

	input[type="text"] {
		margin-bottom: 0;
	}
</style>
