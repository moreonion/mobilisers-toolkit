- do tests for clean html

## Fix Bad Patterns in Existing Tests

### Tests that need improvement

- **quick-check.spec.ts**: Uses hard waits (`waitForTimeout`) instead of proper element waiting
- **share-link.spec.ts**: Uses hard waits (`waitForTimeout`) instead of proper element waiting
- **prepopulation-link.spec.ts**: Uses hard waits (`waitForTimeout`) instead of proper element waiting

### Bad patterns to fix

1. **Hard waits**: Replace `page.waitForTimeout(500)` and `page.waitForTimeout(1000)` with proper element waiting
2. **CSS selectors**: Replace CSS selectors like `input[placeholder*="share"]` with semantic selectors
3. **Missing hydration handling**: Tests don't properly wait for Svelte component hydration
4. **Error collection timing**: Console error collection happens after interactions instead of before
