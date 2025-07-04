<script lang="ts">
  import { getURLSearchParameter } from "@/functions/getURLSearchParameter";
  import { isURL } from "@/functions/isURL";
  import { fade } from "svelte/transition";

  import {
    shareLinkState,
    getAllShareLinks,
  } from "@/data/share-link/store.svelte";

  import Tags from "svelte-unstyled-tags";

  // For testing 👇
  //   $effect(() => {
  //     let link = "https://act.your-organisation.org/campaign-name";
  //     LinkToShare = link;
  //   });

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

<!-- {#if LinkToShare !== "" && isURL(LinkToShare)} -->
{#if shareLinkState.LinkToShare !== ""}
  <section class="mt-6" in:fade={{ delay: 100 }} aria-label="Generated share links">
    <p class="h5 mb-0">Here are the share links</p>
    <p>Copy and paste them wherever you need them.</p>

    <div id="shareLinksWrapper">
      {#each getAllShareLinks() as { platform, shareLink }}
        <div
          class="shareLinkSection"
          id={platform.toLowerCase().replaceAll(" ", "-")}
          role="region"
          aria-label="{platform} share options"
        >
          <p class="mb-0"><strong>{platform}</strong></p>
          <p class="mb-0">{shareLink}</p>

          {#if platform === "Twitter / X"}
            <div class="mt-6">
              <label for="twitterTextarea">
                <small
                  >Enter template text (optional – link already added)</small
                >
                <textarea
                  id="twitterTextarea"
                  maxlength="280"
                  rows="3"
                  bind:value={shareLinkState.TwitterParameters.text}
                  placeholder="Enter more template text"
                  aria-label="Twitter template text"
                ></textarea>
              </label>
              <small
                >{shareLinkState.TwitterParameters.text.length} characters</small
              >
              <div class="mt-6">
                <label for="svelte-tags-input">
                  <small
                    >Type any hashtags (optional) – Enter to add a hashtag</small
                  >
                </label>
                <Tags
                  bind:tags={shareLinkState.TwitterParameters.hashtags}
                  inputPlaceholderText={"Enter any hashtags for your Twitter share..."}
                  onlyUnique={true}
                />
              </div>
            </div>
          {/if}

          {#if platform === "WhatsApp"}
            <label class="mt-6">
              <small>Add template text (optional – link already added)</small>
              <textarea
                rows="3"
                bind:value={shareLinkState.WhatsAppParameters.text}
                placeholder="Enter template text for WhatsApp"
                aria-label="WhatsApp template text"
              ></textarea>
            </label>
          {/if}

          {#if platform === "Email"}
            <div class="mt-6">
              <label>
                <small>Subject (optional)</small>
                <input
                  type="text"
                  bind:value={shareLinkState.EmailParameters.subject}
                  placeholder="Add a subject line (optional)"
                  aria-label="Email subject"
                />
              </label>
              <label>
                <small>Body (optional – link already added)</small>
                <textarea
                  bind:value={shareLinkState.EmailParameters.body}
                  placeholder="Add body text (optional)"
                  aria-label="Email body text"
                ></textarea>
              </label>
            </div>
          {/if}

          {#if platform === "Blue Sky"}
            <label class="mt-6">
              <small>Add template text (optional – link already added)</small>
              <textarea
                rows="3"
                bind:value={shareLinkState.BlueSkyParameters.text}
                placeholder="Enter template text for Blue Sky"
                aria-label="Blue Sky template text"
              ></textarea>
            </label>
          {/if}

          {#if platform === "LinkedIn"}
            <label class="mt-6">
              <small>Add template text (optional – link already added)</small>
              <textarea
                rows="3"
                bind:value={shareLinkState.LinkedInParameters.text}
                placeholder="Enter template text for LinkedIn"
                aria-label="LinkedIn template text"
              ></textarea>
            </label>
            <p>
              <small
                >LinkedIn appears to change the format of its share links quite
                often. Let us know if a LinkedIn link stops working.
              </small>
            </p>
          {/if}

          {#if platform === "Threads"}
            <div class="mt-6">
              <label>
                <small>Text (optional – link already added)</small>
                <input
                  type="text"
                  bind:value={shareLinkState.ThreadsParameters.text}
                  placeholder="Add template text"
                  aria-label="Threads template text"
                />
              </label>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  :global(.svelteUnstyledTagsWrapper .allTagsWrapper) {
    display: flex;
    flex-wrap: wrap;
    column-gap: 1rem;
    row-gap: 1rem;
  }

  :global(.svelteUnstyledTagsWrapper .tagsInputWrapper) {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
  }

  :global(.svelteUnstyledTagsWrapper .tagWrapper) {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #90c92a;
    color: #ffffff;
    font-family: inherit;
    font-size: 80%;
    font-weight: 700;
    border-radius: 5px;
  }

  :global(.svelteUnstyledTagsWrapper .removeTagButton) {
    color: #ffffff;
    cursor: pointer;
    margin-left: 1rem;
    padding: 4px;
  }

  :global(.svelteUnstyledTagsWrapper .removeTagButton:hover) {
    outline: 1px solid;
  }

  :global(.svelteUnstyledTagsWrapper .tagsInput) {
    flex: 1 0 100%;
  }

  #shareLinksWrapper {
    display: flex;
    flex-direction: column;
    row-gap: 2.5rem;
    margin-top: 0.5rem;
    padding: 0.25rem 0.25rem;
  }

  .shareLinkSection {
    padding: 1rem;
    box-shadow: 0 0 5px #e6e6e6;
  }

  #shareLinksWrapper p {
    word-break: break-word;
  }
  #twitterTextarea {
    margin-bottom: 0;
  }
</style>
