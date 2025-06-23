<script lang="ts">
  import { fade } from "svelte/transition";
  import { processHTML } from "@/functions/clean-html/processHTML";

  let unprocessedHTML = $state("");
  let processedHTML = $state("");
  let cleanHTMLCopied = $state(false);

  const handleDirtyHTMLSubmit = (): void => {
    processedHTML = processHTML(unprocessedHTML);
  };

  const copyCleanHTMLToClipboard = (): void => {
    navigator.clipboard.writeText(processedHTML);
    cleanHTMLCopied = true;
  };

  const resetForm = (): void => {
    processedHTML = "";
    unprocessedHTML = "";
    cleanHTMLCopied = false;
  };
</script>

{#if processedHTML === ""}
  <section>
    <div id="dirtyHTMLForm">
      <div>
        <label for="rawHTML"> Enter the HTML you want to clean</label>
        <!-- svelte-ignore a11y_autofocus -->
        <textarea
          name="rawHTML"
          id="rawHTML"
          rows="10"
          placeholder="Enter HTML here"
          required
          bind:value={unprocessedHTML}
          autofocus
        ></textarea>
      </div>

      <div class="flex items-center">
        <button
          class="button filled"
          onclick={handleDirtyHTMLSubmit}
          type="button">Clean →</button
        >
      </div>
    </div>
  </section>
{/if}

{#if processedHTML !== ""}
  <section in:fade={{ delay: 100 }}>
    <div>
      <label for="cleanHTML"> Here's the clean HTML </label>
      <textarea class="h-full" disabled id="cleanHTML">{processedHTML}</textarea
      >
    </div>
    <div class="flex flex-col gap-y-4">
      <div>
        <button
          class="button small filled text-left"
          disabled={cleanHTMLCopied}
          onclick={() => {
            copyCleanHTMLToClipboard();
          }}
        >
          {#if cleanHTMLCopied === false}
            Copy clean HTML to clipboard
          {:else}
            Copied!
          {/if}

          <!-- <span
							class:inline={!cleanHTMLCopied}
							class:hidden={cleanHTMLCopied}
						>
							<img
								src={Clipboard.src}
								alt="clipboard"
							/>
						</span> -->
          <!-- <span
							class:inline={cleanHTMLCopied}
							class:hidden={!cleanHTMLCopied}
						>
							<img
								src={ClipboardSuccessful.src}
								alt="clipboard with a tick"
							/>
						</span> -->
        </button>
      </div>

      <div>
        <button
          class="button small filled"
          onclick={() => {
            resetForm();
          }}
        >
          ← Start again
        </button>
      </div>
    </div>
    <details class="mt-6">
      <summary> See the original HTML </summary>

      <div class="mt-6">
        <label for="dirtyHTML"> Here's the original HTML </label>
        <div id="dirtyHTML">
          {unprocessedHTML}
        </div>
      </div>
    </details>
  </section>
{/if}

<style>
  textarea#cleanHTML {
    min-height: 50vh;
  }
  .text-left {
    text-align: left;
  }
</style>
