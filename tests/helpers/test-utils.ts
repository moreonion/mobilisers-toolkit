import type { Page } from '@playwright/test';

/**
 * Waits for Astro page hydration and Svelte component initialization
 * @param page - Playwright page instance
 * @param componentSelector - Optional specific component selector to wait for
 */
export async function waitForAstroHydration(page: Page, componentSelector?: string) {
  // Wait for network to be idle (Astro static generation)
  await page.waitForLoadState('networkidle');
  
  // If specific component selector provided, wait for it
  if (componentSelector) {
    await page.locator(componentSelector).waitFor();
  }
  
  // Wait for any potential client-side JavaScript to initialize
  await page.waitForFunction(() => {
    // Check if document is ready and any deferred scripts have executed
    return document.readyState === 'complete';
  });
}

/**
 * Utility to collect console errors during test execution
 * Should be called before performing actions that might cause errors
 */
export function setupConsoleErrorTracking(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Validates that a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encodes UTM parameters the same way the application does
 */
export function encodeUtmParameter(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Helper to wait for Svelte component state updates
 * Useful when testing reactive stores and bindings
 */
export async function waitForSvelteUpdate(page: Page, timeout = 2000) {
  // Wait for the next browser tick and ensure DOM updates are complete
  await page.waitForFunction(() => {
    return new Promise(resolve => {
      // Wait for next microtask to ensure Svelte reactivity has processed
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          resolve(true);
        });
      });
    });
  }, { timeout });
}

/**
 * Test data generators for common scenarios
 */
export const testData = {
  urls: {
    simple: 'https://act.example.org/petition',
    withParams: 'https://act.example.org/petition?existing=param&another=value',
    withHash: 'https://act.example.org/petition#section',
    withHashQuery: 'https://act.example.org/petition#section?existing=param',
    noProtocol: 'act.example.org/petition',
    complex: 'https://act.greenpeace.org/save-the-arctic?utm_source=test&campaign=existing'
  },
  
  utmParams: {
    basic: {
      source: 'email',
      medium: 'newsletter',
      campaign: 'test-campaign'
    },
    complete: {
      source: 'facebook',
      medium: 'social',
      campaign: 'save-arctic-2024',
      content: 'video-post',
      term: 'arctic climate change',
      id: 'camp123'
    },
    specialChars: {
      source: 'social media',
      campaign: 'climate & environment',
      content: 'test@example.com',
      term: '#climateaction'
    }
  },

  // Clean HTML test data
  htmlSamples: {
    // Complex Word document HTML with extensive formatting
    wordDocument: `<h1 style="margin-top:24px; margin-bottom:5px"><span style="font-size:20pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos Display&quot;,serif"><span style="color:#0f4761"><span style="font-weight:normal">Heading one</span></span></span></span></span></h1>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<h2 style="margin-top:11px; margin-bottom:5px"><span style="font-size:16pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos Display&quot;,serif"><span style="color:#0f4761"><span style="font-weight:normal">Heading two</span></span></span></span></span></h2>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<h3 style="margin-top:11px; margin-bottom:5px"><span style="font-size:14pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#0f4761"><span style="font-weight:normal">Heading three</span></span></span></span></span></h3>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<h4 style="margin-top:5px; margin-bottom:3px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#0f4761"><span style="font-weight:normal"><span style="font-style:italic">Heading 4</span></span></span></span></span></span></h4>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<ul style="margin-bottom:11px">
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Bullet</span></span></span></li>
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">List</span></span></span></li>
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Of</span></span></span></li>
    <li style="margin-bottom:11px; margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Items</span></span></span></li>
</ul>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<ol style="margin-bottom:11px">
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Numbered</span></span></span></li>
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">List</span></span></span></li>
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Of</span></span></span></li>
    <li style="margin-bottom:11px; margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Items</span></span></span></li>
</ol>

<p style="margin-left:24px; margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif">Indented Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></p>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><b>Proident</b> <i>officia</i> <b><i>excepteur</i></b> <u>eiusmod</u> <b><i><u>excepteur</u></i></b> <s>labore</s> <sub>ea</sub> nisi <span style="background:yellow">consectetur</span> tempor.</span></span></span></p>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#ee0000">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></span></p>

<ul style="margin-bottom:11px">
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#ee0000">Bullet</span></span></span></span></li>
    <li style="margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#ee0000">Point</span></span></span></span></li>
    <li style="margin-bottom:11px; margin-left:8px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><span style="color:#ee0000">List</span></span></span></span></li>
</ul>

<p style="margin-bottom:11px"><span style="font-size:12pt"><span style="line-height:115%"><span style="font-family:&quot;Aptos&quot;,sans-serif"><a href="https://google.com/" style="color:#467886; text-decoration:underline">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</a></span></span></span></p>`,

    // Simple test cases
    simpleFormatting: '<p>Hello <b>world</b>!</p>',
    
    styledSpans: `<p>Text with <span style="font-weight:700">bold</span> and <span style="font-style:italic">italic</span> and <span style="text-decoration:underline">underlined</span> content.</p>`,
    
    unwantedTags: `<div class="wrapper"><p>Content with <span style="color: red;">styled text</span></p><div>Another div</div></div>`,
    
    googleRedirect: `<p>Check out <a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage&amp;source=gmail">this link</a></p>`,
    
    malformed: '<p>Unclosed paragraph<div>Mixed tags<span>No closing tags',
    
    scripts: `<p>Safe content</p><script>alert('xss');</script><style>body { background: red; }</style><p>More safe content</p>`,
    
    specialChars: '<p>&amp; &lt; &gt; &quot; &#x27; unicode: 你好 🌟</p>',

    // Google Docs HTML with extreme span nesting and formatting
    googleDocsDocument: `<h1 style="line-height:1.2; margin-top:27px; margin-bottom:8px"><span style="font-size:36pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#343433"><span style="font-weight:900"><span style="font-style:normal"><span style="text-decoration:none">Heading one</span></span></span></span></span></span></h1>

<p style="line-height:1.38"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></span></span></span></p>

<h2 style="line-height:1.2; margin-top:24px; margin-bottom:8px"><span style="font-size:24pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#ae328b"><span style="font-weight:900"><span style="font-style:normal"><span style="text-decoration:none">Heading two</span></span></span></span></span></span></h2>

<p style="line-height:1.38"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></span></span></span></p>

<h3 style="line-height:1.2; margin-top:21px; margin-bottom:5px"><span style="font-size:18pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#343433"><span style="font-weight:900"><span style="font-style:normal"><span style="text-decoration:none">Heading three</span></span></span></span></span></span></h3>

<p style="line-height:1.38"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Proident officia excepteur eiusmod excepteur labore ea nisi consectetur tempor.</span></span></span></span></span></span></p>

<p>&nbsp;</p>

<p>&nbsp;
    </p><p style="line-height:1.38"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:700"><span style="font-style:normal"><span style="text-decoration:none">Proident</span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:italic"><span style="text-decoration:none">officia</span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:700"><span style="font-style:italic"><span style="text-decoration:none">excepteur</span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:underline"><span style="-webkit-text-decoration-skip:none"><span style="text-decoration-skip-ink:none">eiusmod</span></span></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:italic"><span style="text-decoration:underline"><span style="-webkit-text-decoration-skip:none"><span style="text-decoration-skip-ink:none">excepteur</span></span></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:700"><span style="font-style:italic"><span style="text-decoration:underline"><span style="-webkit-text-decoration-skip:none"><span style="text-decoration-skip-ink:none">labore</span></span></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:700"><span style="font-style:italic"><span style="text-decoration:none">ea</span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"><sup style="font-size:0.6em">nisi</sup></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"><sub style="font-size:0.6em">consectetur</sub></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none"> </span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:line-through"><span style="-webkit-text-decoration-skip:none"><span style="text-decoration-skip-ink:none">tempor</span></span></span></span></span></span></span></span><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">.</span></span></span></span></span></span></p>
<p></p>

<p>&nbsp;
    </p><ul>
        <li aria-level="1" style="list-style-type:disc"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Bullet</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:disc"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Point</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:disc"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">List</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:disc"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">of&nbsp;</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:disc"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Items</span></span></span></span></span></span></li>
    </ul>
<p></p>

<p>&nbsp;
    </p><ol>
        <li aria-level="1" style="list-style-type:decimal"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Numbered</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:decimal"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">List</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:decimal"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Of</span></span></span></span></span></span></li>
        <li aria-level="1" style="list-style-type:decimal"><span style="font-size:12pt; font-variant:normal; white-space:pre-wrap"><span style="font-family:Heebo,sans-serif"><span style="color:#31302e"><span style="font-weight:300"><span style="font-style:normal"><span style="text-decoration:none">Items</span></span></span></span></span></span></li>
    </ol>
    <br>
    &nbsp;<p></p>`
  }
};