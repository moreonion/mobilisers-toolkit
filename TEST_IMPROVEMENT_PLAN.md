# Playwright Test Improvement Plan

Source: TDD review of `tests/*.spec.ts`, `tests/pages/*.ts`,
`tests/helpers/test-utils.ts`.

## Ground rules while executing this plan

- **One test at a time.** Pick a single item below, fix it, run it, move
  on. Do not batch-rewrite a whole spec file in one pass — that's the same
  horizontal-slicing mistake that produced these issues in the first
  place.
- **Confirm intended behavior before touching assertions**, not just
  current behavior. Several tests assert whatever the code currently
  does. Before rewriting, decide (with the person who owns the feature,
  or by reading any spec/ticket) what *should* happen, then write the
  assertion as a spec. If current behavior is correct, say so in the
  test name/comment as a decision, not an observation.
- **Prefer `getByRole` / `getByLabel` / `getByText`** over CSS
  id/class/tag selectors every time you touch a locator. If no
  accessible query exists, that's a signal the component is missing an
  ARIA label/role — fix the component, not just the test.
- **New ARIA label wording needs sign-off before it ships** (confirmed
  2026-07-01). Drafting proposed label text while implementing is
  fine, but run the exact copy past the feature owner before
  finalizing — this is user-facing screen-reader text, not just test
  plumbing, so it's a small product-copy decision each time.
- Run `pnpm test` after each change; don't move to the next item on a
  red run.

## Phase 1 — Resolve the "based on actual behavior" tests (highest priority)

These tests were written by reading what the code does, not what it
should do. Investigation into `src/data/tracking-link/store.svelte.ts`
and `src/islands/tracking-link.svelte` (2026-07-01) resolved 3 of the
4 as *confirmed intentional behavior* — the code has explicit comments
proving intent, so no product decision is needed, only a rewrite from
substring assertions to structured ones (moved to Phase 3 below). One
item is a genuine "decide with the feature owner" case.
`tests/tracking-link.spec.ts`:

- [x] L234-247 `should show duplicate tracking link outputs` — comment:
      "Based on component structure, there are two identical outputs".
      **Confirmed real** (`src/islands/tracking-link.svelte` L45-52 vs
      L131-140): one `#trackingLinkWrapper` is the live preview under
      "Build your tracking link using the form below", the other is
      the final copy-friendly output under "Here's your tracking link
      / Copy and paste it wherever you need it." Replace the
      length-2/index-based assertion with two tests scoped by each
      section's accessible name (e.g.
      `getByRole('region', { name: /build your tracking link/i })` vs
      `getByRole('region', { name: /here's your tracking link/i })`),
      each asserting the link is present and updates live — the actual
      user-facing reason two copies exist, not an incidental DOM count.
      **Decision (2026-07-01): also keep a lightweight sync check** —
      after filling the form once, assert both sections' parsed URLs
      are equal. Per-section tests alone wouldn't catch a future
      regression where the two sections read from different state and
      one goes stale.

The other 3 items no longer need a decision — see Phase 3, which now
includes their specific rewrites plus the intended-value assertions
that come with confirming they're deliberate:

- ~~L131-146 `should handle URLs with fragments/hash`~~ — **confirmed
  intentional**: `store.svelte.ts` L62-73 explicitly detects `?` inside
  `hash` and moves those params into `searchParams`, with a comment
  explaining why. Not a "should we support this" question — rewrite
  as a structured assertion (Phase 3).
- ~~L171-183 `should handle invalid URLs gracefully`~~ — **confirmed
  intentional**: `store.svelte.ts` L35 comment states the tool
  "Supports URLs with or without a scheme (e.g., 'google.com' or
  'https://google.com')". Rename to describe the decision (e.g.
  "auto-adds https:// when no scheme is given") and assert via parsed
  `URL` (Phase 3), not "gracefully".
- ~~L185-206 `should handle multiple protocol schemes correctly`~~ —
  **confirmed intentional**: `store.svelte.ts` L52-60 has an explicit
  allowlist (`http:`, `https:`, `fb-messenger:`, `mailto:`) and
  explicitly rejects everything else. Split into one test per
  supported protocol (Phase 3) **and add the missing negative case**:
  a currently-untested test asserting an unsupported scheme (e.g.
  `javascript:` or `ftp:`) produces empty output — the allowlist's
  rejection branch has zero coverage today.

## Phase 2 — Replace implementation-coupled selectors with accessible queries

`tests/prepopulation-link.spec.ts`:

- [x] L49-51, L76-78, L136-138, L181-183 — `tr:has(td:text("..."))`,
      `input[type="checkbox"]`, `input[type="number"]`. Add accessible
      labels to the table rows/inputs in the component (e.g.
      `aria-label="Donation interval field toggle"`) and switch tests
      to `getByLabel`/`getByRole('checkbox', { name })`.
      **Done (2026-07-01):** added `aria-label={`${field.label} prefill
      toggle`}` to the checkbox, `aria-label={`${field.label} token`}`
      to the select/token input, and `aria-label={`${field.label} form
      key`}` to the custom-field form-key input in
      `FieldSelector.svelte`. Wording confirmed with the feature owner.
- [x] L111-114 `page.locator('tr').last()` for the newly-added custom
      field row — replace with a locator scoped by the field's own
      accessible name once added. **Done:** now
      `page.getByLabel('Custom field form key')` /
      `'Custom field token'` / `'Custom field prefill toggle'`.

`tests/share-link.spec.ts`:

- [x] L79, L85, L91 — `.tagWrapper:has-text(...)`, `.removeTagButton`.
      Switch to `getByRole('button', { name: /remove climate/i })` or
      similar once the tag/remove button has an accessible name (add
      one if missing).
      **Done (2026-07-01):** updated to `svelte-unstyled-tags@0.1.1`,
      which defaults remove buttons to `aria-label="Remove {tag}"`, and
      replaced the remaining test/POM CSS selectors with a named
      remove-button role query (`Remove ${tag}`). Note: 0.1.1 does not
      expose a per-tag accessible name for the `listitem` role, so the
      tests use the named remove button as the user-facing proof that
      the tag exists.

`tests/pages/tracking-link-page.ts`:

- [x] L56, L61, L70 — `#trackingLinkWrapper`, `.locator('..')`
      parent-traversal, `.locator('../..')`. Replace with
      `getByRole('region', { name: ... })` or a dedicated
      `data-testid`-free accessible container (e.g. wrap in a
      `<section aria-label="...">`, matching the pattern already used
      well in `share-link.spec.ts`'s Facebook/Twitter/etc. regions).
      **Done (2026-07-01):** `trackingFormSection` /
      `finalTrackingLinkSection` / `utmFormContainer` were dead code
      (deleted). `trackingLinkOutputs`/`previewLink`/`outputLink` no
      longer need the CSS id — both preview/output regions already have
      `aria-label`s, so the getters now scope `previewRegion`/
      `outputRegion` and take `.locator('p').last()` (the link is
      always the last paragraph in each region). No new ARIA label
      needed. `trackingLinkOutputs` is now a plain array (not a
      Locator), since `previewLink`/`outputLink` live in two different
      regions and `.or()` doesn't reliably combine two simultaneously-
      present locators.

`tests/pages/clean-html-page.ts`:

- [x] L31, L51, L56 — `#cleanHTML`, `#dirtyHTML`, `#dirtyHTMLForm`.
      Replace with `getByRole`/`getByLabel` once the corresponding
      elements have accessible names; add `aria-label`s to the
      component if needed.
      **Done (2026-07-01):** `#cleanHTML` already had a working
      `<label for="cleanHTML">` — just switched to
      `getByLabel("Here's the clean HTML")`, no component change.
      `#dirtyHTML` is a `<div>`, so its `<label for="dirtyHTML">` never
      actually associated (labels only bind to form controls) — added
      `role="group" aria-label="Original HTML"` to the div instead.
      Added `aria-label="Enter HTML to clean"` /
      `aria-label="Clean HTML output"` to the two wrapping `<section>`s
      for `inputSection`/`outputSection`. Note: initially tried
      wording that matched the visible copy exactly (e.g. "Enter the
      HTML you want to clean" on both the section and the textarea
      label) — Playwright's `getByLabel` matched both elements and
      broke `rawHtmlTextarea` with a strict-mode violation, so section/
      group labels need to stay textually distinct from any form
      control's own label in the same tree.

## Phase 3 — Stop asserting on exact encoded output

Several tests check literal percent-encoded (or `+`-encoded) strings,
which couples the test to the specific encoding call the code happens
to use.

- [x] `tests/share-link.spec.ts` L88, 94-95, 322 —
      `hashtags=climate,environment`, `%40everyone`. Replace with
      decoding the URL first (`new URL(...)` + `searchParams.get(...)`)
      and asserting on the decoded value, e.g.
      `expect(url.searchParams.get('hashtags')).toBe('climate,environment')`.
- [x] `tests/pages/tracking-link-page.ts` L139-155
      `expectGeneratedLinkContains` /
      `expectGeneratedLinkContainsUtmParam` — same fix: parse the
      generated string as a `URL`, read `searchParams`, compare decoded
      values. Delete the `.replace(/%20/g, '+')` workaround (L149) once
      this is in place — it exists only to match an encoding quirk, not
      a requirement.
      **Decision (2026-07-01): only `expectGeneratedLinkContainsUtmParam`
      was rewritten to parse-and-compare.** `expectGeneratedLinkContains`
      is a generic substring checker used for things that aren't
      percent-encoded key/value pairs (base URLs, path segments, raw
      `existing=param` query fragments) — it has no actual encoding
      coupling to fix, so URL-parsing it would only break call sites
      for no benefit. Left as-is.
- [x] Apply the same decode-then-compare pattern anywhere else
      `text=...%XX...` literals appear (`share-link.spec.ts`
      throughout).

`tests/tracking-link.spec.ts` — rewrites of the 3 confirmed-intentional
tests from Phase 1, using the same parse-then-assert approach instead
of substring `.toContain(...)`:

- [x] L131-146 `should handle URLs with fragments/hash` → rename to
      state the behavior (e.g. "moves query params found after # into
      the URL's search params"). Parse `getGeneratedLink()` with
      `new URL(...)` and assert `url.hash === '#section'` and
      `url.searchParams.get('existing') === 'param'` and
      `url.searchParams.get('utm_source') === 'newsletter'` explicitly,
      instead of two `toContain` checks.
- [x] L171-183 `should handle invalid URLs gracefully` → rename to
      "auto-adds https:// scheme when the input has no protocol".
      Parse the result with `new URL(...)` and assert
      `url.protocol === 'https:'` and `url.hostname === 'not-a-valid-url'`
      explicitly.
- [x] L185-206 `should handle multiple protocol schemes correctly` →
      split into one test per protocol (`https:`, `http:`, `mailto:`,
      `fb-messenger:`). **Decision (2026-07-01, confirmed with feature
      owner): there's no deeper business rationale beyond "these are
      the protocols on the allow-list"** — don't invent use-case
      framing (e.g. "email campaigns") in test names since that isn't
      actually documented anywhere. Name tests plainly, e.g. "supports
      mailto: links (allow-listed protocol)". Add the missing negative
      test: an unsupported scheme (e.g. `javascript:`) results in
      empty generated output, matching the rejection branch in
      `store.svelte.ts` L52-60.

## Phase 4 — Give share-link and prepopulation-link a Page Object

`clean-html.spec.ts` and `tracking-link.spec.ts` use POM classes;
`share-link.spec.ts` and `prepopulation-link.spec.ts` don't, which is
why selectors got duplicated and pulled toward CSS/DOM shortcuts.

- [x] Create `tests/pages/share-link-page.ts` mirroring the structure
      of `tracking-link-page.ts`: one class, accessible-query getters
      per platform section, action methods (`fillTwitterText`,
      `addHashtag`, `removeHashtag`, ...), assertion methods.
      **Done (2026-07-01).** `removeHashtag` now uses the named remove
      button from `svelte-unstyled-tags@0.1.1`, so the page object no
      longer depends on the tag component's CSS classes.
- [x] Create `tests/pages/prepopulation-link-page.ts` similarly, with
      methods for provider switching, field toggling, custom field add.
      **Done (2026-07-01).**
- [x] Migrate `share-link.spec.ts` and `prepopulation-link.spec.ts` to
      use these POMs, one test at a time (don't do a mechanical
      find-replace across the whole file in one commit — verify each
      migrated test still asserts the same *behavior*, not just the
      same locator).
      **Done (2026-07-01):** both spec files migrated, full suite
      verified green after each file (71/71 tests passing).

## Phase 5 — Remove flake/debug residue

- [x] `tests/pages/clean-html-page.ts` L102 —
      `page.waitForTimeout(100)` in `expandOriginalHtmlDetails`.
      Replace with waiting on the actual post-condition (e.g. the
      `<details>` element's `open` attribute, or the content becoming
      visible/accessible).
      **Done (2026-07-01):** now asserts `detailsElement` has the
      `open` attribute, then waits for `originalHtmlContent` to become
      visible — no arbitrary timeout.
- [x] `tests/pages/clean-html-page.ts` L175-183 —
      `debugCurrentState()`. **Decision (2026-07-01): comment it out**
      rather than delete — it's occasionally reached for during local
      debugging, but shouldn't remain live public API on the page
      object.
      **Done (2026-07-01):** commented out on the page object; its one
      call site (`tests/clean-html.spec.ts` L44-51, a try/catch around
      an assertion purely to invoke the debug helper on failure) was
      simplified back to plain assertions since the helper it depended
      on is no longer callable.

## Phase 6 — Consider unit tests for the pure logic underneath (optional)

Everything today is verified only through a full browser + dev server.
The following modules are pure logic and would get faster, more
precise coverage from direct unit tests, in addition to (not instead
of) the Playwright specs that verify the wiring:

- `src/functions/clean-html/processHTML.ts`
- `src/data/tracking-link/store.svelte.ts`
- `src/data/share-link/store.svelte.ts`
- `src/data/prepopulation-link/store.svelte.ts`

If pursued, treat this as its own TDD cycle: pick one untested behavior
in one of these modules, write a failing unit test for it, make it
pass, repeat. Don't port the existing Playwright assertions wholesale —
port the *rewritten* structured assertions from Phase 3 (parsed `URL`
checks, per-protocol tests, the rejection-branch test), not the
original substring-matching versions.

## Suggested order

Phase 1 (now just the duplicate-outputs decision — quick) → Phase 3
(structured assertions, including the 3 rewrites folded in from the
old Phase 1, plus the new negative-scheme test) → Phase 2 (selector
hygiene, touches components too) → Phase 4 (structural cleanup) →
Phase 5 (small, do anytime) → Phase 6 (separate, larger effort —
schedule independently).
