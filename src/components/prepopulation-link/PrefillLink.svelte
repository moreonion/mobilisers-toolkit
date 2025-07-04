<script lang="ts">
  import {
    prepopulationLinkStore,
    type PrefillFormFieldsType,
  } from "@/data/prepopulation-link/store.svelte";
  import { type EmailMarketingProviders } from "@/data/prepopulation-link/emailMarketingTokens";
  import EmailProviderTabs from "@/components/prepopulation-link/EmailProviderTabs.svelte";

  // Accept form fields from parent component
  let { formFields = $bindable() }: { formFields: PrefillFormFieldsType[] } =
    $props();

  const checked = $derived(formFields.filter((field) => field.prefilled));

  const prefillLinkParts = $derived(
    checked
      .filter((field) => field.formKey !== "" && field.token !== "")
      .map((field) => `${field.formKey}=${field.token}`)
  );

  const selectedProvider = $derived(
    $prepopulationLinkStore.selectedEmailProvider as EmailMarketingProviders
  );

  const trackingUrl = $derived(
    `/tracking-link?url=${encodeURIComponent(
      $prepopulationLinkStore.actionPageURL + "#p:" + prefillLinkParts.join("&")
    )}`
  );
</script>

<section class="mt-6">
  <p class="h5 mb-0">Here's the link to put in your email to supporters</p>
  <p>
    Supporters clicking this link in an email from you will see an Impact Stack
    form prefilled with the data you have about them in {selectedProvider !==
    "Other"
      ? selectedProvider
      : "your email marketing tool"}.
  </p>
  <div id="prefillLinkWrapper">
    <EmailProviderTabs />

    <!-- prettier-ignore -->
    <p class="mb-0">
			{$prepopulationLinkStore.actionPageURL}#p:<wbr/>{#each prefillLinkParts as part, index}<span>{part}</span>{#if index < prefillLinkParts.length - 1}&<wbr/>{/if}{/each}
		</p>
    <a class="button tiny" href={trackingUrl}>Add tracking</a>
  </div>
</section>

<style>
  #prefillLinkWrapper {
    margin-top: 0.5rem;
    border: 1px solid #495057;
    border-radius: 5px;
    padding: 0.25rem 0.25rem;
  }

  #prefillLinkWrapper p {
    padding: 1rem;
    word-break: break-word;
    line-height: 1.75;
  }
  #prefillLinkWrapper p span {
    font-weight: 400;
    text-decoration: underline;
    text-underline-offset: 8px;
    text-decoration-thickness: 2px;
  }
</style>
