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
- Run `pnpm test` after each change; don't move to the next item on a
  red run.

## Phase 1 — Un-observe the "based on actual behavior" tests (highest priority)

These tests were written by reading what the code does, not what it
should do. They can hide real bugs. `tests/tracking-link.spec.ts`:

- [ ] L131-146 `should handle URLs with fragments/hash` — comment:
      "based on store logic". Decide: is
      `https://act.example.org/petition#section?existing=param`
      actually a URL this tool needs to support? If yes, assert the
      *intended* parsed result explicitly (which part is the fragment
      vs. query) instead of just "contains both strings somewhere".
- [ ] L171-183 `should handle invalid URLs gracefully` — comment:
      "Based on actual behavior, the app auto-prefixes https://".
      Decide: is silently prefixing `not-a-valid-url` →
      `https://not-a-valid-url/` the desired UX, or should this show a
      validation error? Rewrite the test to assert the decision, and
      rename the test to describe that decision (not "gracefully").
- [ ] L185-206 `should handle multiple protocol schemes correctly` —
      comment: "based on store logic". Confirm which schemes are
      actually meant to be supported (`mailto:`, `fb-messenger://`?) —
      this looks like it may be testing accidental support rather than
      a requirement. Split into one test per protocol with a name that
      states why it's supported.
- [ ] L234-247 `should show duplicate tracking link outputs` — comment:
      "Based on component structure, there are two identical outputs".
      This test pins an implementation accident (two DOM copies of the
      same output). Either delete it, or replace it with a test for the
      actual user-facing reason two copies exist (e.g. "the link is
      visible both above and below the form without scrolling") if
      that's a real design requirement.

## Phase 2 — Replace implementation-coupled selectors with accessible queries

`tests/prepopulation-link.spec.ts`:

- [ ] L49-51, L76-78, L136-138, L181-183 — `tr:has(td:text("..."))`,
      `input[type="checkbox"]`, `input[type="number"]`. Add accessible
      labels to the table rows/inputs in the component (e.g.
      `aria-label="Donation interval field toggle"`) and switch tests
      to `getByLabel`/`getByRole('checkbox', { name })`.
- [ ] L111-114 `page.locator('tr').last()` for the newly-added custom
      field row — replace with a locator scoped by the field's own
      accessible name once added.

`tests/share-link.spec.ts`:

- [ ] L79, L85, L91 — `.tagWrapper:has-text(...)`, `.removeTagButton`.
      Switch to `getByRole('button', { name: /remove climate/i })` or
      similar once the tag/remove button has an accessible name (add
      one if missing).

`tests/pages/tracking-link-page.ts`:

- [ ] L56, L61, L70 — `#trackingLinkWrapper`, `.locator('..')`
      parent-traversal, `.locator('../..')`. Replace with
      `getByRole('region', { name: ... })` or a dedicated
      `data-testid`-free accessible container (e.g. wrap in a
      `<section aria-label="...">`, matching the pattern already used
      well in `share-link.spec.ts`'s Facebook/Twitter/etc. regions).

`tests/pages/clean-html-page.ts`:

- [ ] L31, L51, L56 — `#cleanHTML`, `#dirtyHTML`, `#dirtyHTMLForm`.
      Replace with `getByRole`/`getByLabel` once the corresponding
      elements have accessible names; add `aria-label`s to the
      component if needed.

## Phase 3 — Stop asserting on exact encoded output

Several tests check literal percent-encoded (or `+`-encoded) strings,
which couples the test to the specific encoding call the code happens
to use.

- [ ] `tests/share-link.spec.ts` L88, 94-95, 322 —
      `hashtags=climate,environment`, `%40everyone`. Replace with
      decoding the URL first (`new URL(...)` + `searchParams.get(...)`)
      and asserting on the decoded value, e.g.
      `expect(url.searchParams.get('hashtags')).toBe('climate,environment')`.
- [ ] `tests/pages/tracking-link-page.ts` L139-155
      `expectGeneratedLinkContains` /
      `expectGeneratedLinkContainsUtmParam` — same fix: parse the
      generated string as a `URL`, read `searchParams`, compare decoded
      values. Delete the `.replace(/%20/g, '+')` workaround (L149) once
      this is in place — it exists only to match an encoding quirk, not
      a requirement.
- [ ] Apply the same decode-then-compare pattern anywhere else
      `text=...%XX...` literals appear (`share-link.spec.ts`
      throughout).

## Phase 4 — Give share-link and prepopulation-link a Page Object

`clean-html.spec.ts` and `tracking-link.spec.ts` use POM classes;
`share-link.spec.ts` and `prepopulation-link.spec.ts` don't, which is
why selectors got duplicated and pulled toward CSS/DOM shortcuts.

- [ ] Create `tests/pages/share-link-page.ts` mirroring the structure
      of `tracking-link-page.ts`: one class, accessible-query getters
      per platform section, action methods (`fillTwitterText`,
      `addHashtag`, `removeHashtag`, ...), assertion methods.
- [ ] Create `tests/pages/prepopulation-link-page.ts` similarly, with
      methods for provider switching, field toggling, custom field add.
- [ ] Migrate `share-link.spec.ts` and `prepopulation-link.spec.ts` to
      use these POMs, one test at a time (don't do a mechanical
      find-replace across the whole file in one commit — verify each
      migrated test still asserts the same *behavior*, not just the
      same locator).

## Phase 5 — Remove flake/debug residue

- [ ] `tests/pages/clean-html-page.ts` L102 —
      `page.waitForTimeout(100)` in `expandOriginalHtmlDetails`.
      Replace with waiting on the actual post-condition (e.g. the
      `<details>` element's `open` attribute, or the content becoming
      visible/accessible).
- [ ] `tests/pages/clean-html-page.ts` L175-183 —
      `debugCurrentState()`. Delete it, or if useful for local
      debugging, move it behind an explicit opt-in rather than leaving
      it as public API on the page object.

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
many of them are the "based on actual behavior" tests from Phase 1 and
shouldn't be duplicated into unit form until they've been turned into
real specifications.

## Suggested order

Phase 1 → Phase 3 (both fix correctness/intent of assertions) → Phase 2
(selector hygiene, touches components too) → Phase 4 (structural
cleanup) → Phase 5 (small, do anytime) → Phase 6 (separate, larger
effort — schedule independently).
