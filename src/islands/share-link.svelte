<script lang="ts">
  import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
  import { isURL } from "@/functions/isURL";
  import { fade } from "svelte/transition";

  import { shareLinkState } from "@/data/share-link/store.svelte";
  import ShareLinkList from "@/components/share-link/ShareLinkList.svelte";

  // Get any parameter called url from the URL and keep it in the store.
  $effect(() => {
    const urlParameter = getURLSearchParameter("url");
    if (urlParameter && isURL(urlParameter)) {
      shareLinkState.LinkToShare = urlParameter;
    }
  });
</script>

<section>
  <form>
    <label for="actionPage" class="flex flex-col">
      Enter the link you want to be shareable <small
        >https://act.your-organisation.org/campaign-name</small
      >
    </label>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      type="text"
      name="actionPage"
      id="actionPage"
      placeholder="Enter the link you want people to share"
      aria-label="Enter the link you want to be shareable"
      bind:value={shareLinkState.LinkToShare}
      autofocus
    />
  </form>
</section>

{#if shareLinkState.LinkToShare !== ""}
  <section class="mt-6" in:fade={{ delay: 100 }} aria-label="Generated share links">
    <p class="h5 mb-0">Here are the share links</p>
    <p>Copy and paste them wherever you need them.</p>

    <ShareLinkList />
  </section>
{/if}
