<script lang="ts">
  import { fade } from "svelte/transition";
  import { untrack } from "svelte";
  import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
  import { isURL } from "@/functions/isURL";
  import {
    prepopulationLinkStore,
    prepopulationState,
    basePrefillFormFields,
  } from "@/data/prepopulation-link/store.svelte";
  import {
    emailMarketingTokens,
    type EmailMarketingProviderFields,
    type EmailMarketingProviders,
  } from "@/data/prepopulation-link/emailMarketingTokens";

  import PrefillLink from "@/components/prepopulation-link/PrefillLink.svelte";
  import FieldSelector from "@/components/prepopulation-link/FieldSelector.svelte";

  // For testing 👇
  // $effect(() => {
  // 	let formActionURL = "https://act.your-organisation.org/campaign-name";
  // 	$prepopulationLinkStore.actionPageURL = formActionURL;
  // });

  // Get any parameter called url from the URL and keep it in the store.
  $effect(() => {
    const urlParameter = getURLSearchParameter("url");
    if (urlParameter && isURL(urlParameter)) {
      $prepopulationLinkStore.actionPageURL = urlParameter;
    }
  });

  // Helper function to get token for a field and provider
  function getToken(
    key: EmailMarketingProviderFields,
    provider: EmailMarketingProviders
  ): string {
    return emailMarketingTokens[key]?.[provider] ?? "";
  }

  // Create shared mutable form fields for editing, initialized with tokens
  let sharedFormFields = $state(
    basePrefillFormFields.map((field) => {
      const key = field.formKey as EmailMarketingProviderFields;
      const currentProvider = $prepopulationLinkStore.selectedEmailProvider;
      return {
        ...field,
        token: getToken(key, currentProvider),
      };
    })
  );

  // Update only email marketing tokens when provider changes, preserve custom field values
  // untrack() prevents infinite reactivity loop when reading sharedFormFields within its own $effect
  $effect(() => {
    const currentProvider = $prepopulationLinkStore.selectedEmailProvider;
    sharedFormFields = untrack(() => sharedFormFields).map((field) => {
      const emailMarketingToken = getToken(
        field.formKey as EmailMarketingProviderFields,
        currentProvider
      );
      // For "Other" provider, clear all email marketing tokens but preserve custom fields
      if (currentProvider === "Other") {
        const isEmailMarketingField =
          emailMarketingToken !== "" ||
          ["first_name", "last_name", "email", "postcode"].includes(
            field.formKey
          );
        return {
          ...field,
          token: isEmailMarketingField ? "" : field.token,
        };
      }
      // For other providers, only update token if it's an email marketing field (has a predefined token)
      // Otherwise preserve the existing custom value
      return {
        ...field,
        token: emailMarketingToken !== "" ? emailMarketingToken : field.token,
      };
    });
  });
</script>

<section>
  <form>
    <label for="actionPage" class="flex flex-col">
      Enter your Impact Stack action URL <small
        >https://act.your-organisation.org/campaign-name</small
      >
    </label>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      name="actionPage"
      id="actionPage"
      placeholder="Action page URL"
      bind:value={$prepopulationLinkStore.actionPageURL}
      autofocus
    />
  </form>
</section>

{#if $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
  <div in:fade={{ delay: 100 }}>
    <PrefillLink bind:formFields={sharedFormFields} />
  </div>
  {#if prepopulationState.customiseFields === false && $prepopulationLinkStore.selectedEmailProvider !== "Other"}
    <div class="mt-6 pt-2">
      <button
        class="button tiny"
        onclick={() => {
          prepopulationState.customiseFields = true;
        }}>Customise fields</button
      >
    </div>
  {/if}
{/if}

{#if (prepopulationState.customiseFields === true || $prepopulationLinkStore.selectedEmailProvider === "Other") && $prepopulationLinkStore.actionPageURL !== "" && isURL($prepopulationLinkStore.actionPageURL)}
  <div in:fade={{ delay: 100 }}>
    <FieldSelector bind:formFields={sharedFormFields} />
  </div>
  <PrefillLink bind:formFields={sharedFormFields} />
{/if}
