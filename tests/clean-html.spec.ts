import { test, expect } from '@playwright/test';
import { CleanHtmlPage } from './pages/clean-html-page';
import { testData } from './helpers/test-utils';

test.describe('Clean HTML Tool', () => {
  let cleanHtmlPage: CleanHtmlPage;

  test.beforeEach(async ({ page }) => {
    cleanHtmlPage = new CleanHtmlPage(page);
  });

  test.describe('Initial Page State', () => {
    test('should load page and show correct initial state', async () => {
      await cleanHtmlPage.goto();

      // Should show input form only
      await cleanHtmlPage.expectInitialState();

      // Input should be focused (autofocus attribute)
      await cleanHtmlPage.expectInputFocused();

      // Should have placeholder text
      await cleanHtmlPage.expectTextareaHasPlaceholder();
    });

    // Note: Skipping console error test as some 404s for assets (favicon, etc.) are expected in dev
  });

  test.describe('HTML Processing Workflow', () => {
    test('should process simple HTML and show output', async () => {
      await cleanHtmlPage.goto();

      const simpleHtml = '<p>Hello <b>world</b>!</p>';

      await test.step('Enter HTML and process', async () => {
        await cleanHtmlPage.processHtml(simpleHtml);
      });

      await test.step('Verify output state', async () => {
        await cleanHtmlPage.expectOutputState();
      });

      await test.step('Verify HTML was processed', async () => {
        // Debug the current state if assertion fails
        try {
          await cleanHtmlPage.expectCleanHtmlContains('Hello');
          await cleanHtmlPage.expectCleanHtmlContains('world');
        } catch (error) {
          await cleanHtmlPage.debugCurrentState();
          throw error;
        }

        // <b> should be converted to <strong>
        await cleanHtmlPage.expectBoldTagsNormalized();
      });

      await test.step('Verify original HTML is preserved', async () => {
        await cleanHtmlPage.expectOriginalHtmlPreserved(simpleHtml);
      });
    });

    test('should remove unwanted span and div tags', async () => {
      await cleanHtmlPage.goto();

      const htmlWithUnwantedTags = `
        <div class="wrapper">
          <p>Content with <span style="color: red;">styled text</span></p>
          <div>Another div</div>
        </div>
      `;

      await cleanHtmlPage.processHtml(htmlWithUnwantedTags);

      // Should remove span and div tags
      await cleanHtmlPage.expectSpanTagsRemoved(htmlWithUnwantedTags);
      await cleanHtmlPage.expectDivTagsRemoved(htmlWithUnwantedTags);

      // But preserve the content
      await cleanHtmlPage.expectCleanHtmlContains('Content with');
      await cleanHtmlPage.expectCleanHtmlContains('styled text');
      await cleanHtmlPage.expectCleanHtmlContains('Another div');
    });

    test('should transform styled spans to semantic tags', async () => {
      await cleanHtmlPage.goto();

      const styledSpanHtml = `
        <p>Text with <span style="font-weight:700">bold</span> and <span style="font-style:italic">italic</span> and <span style="text-decoration:underline">underlined</span> content.</p>
      `;

      await cleanHtmlPage.processHtml(styledSpanHtml);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should convert styled spans to semantic tags
      expect(cleanHtml).toContain('<strong>bold</strong>');
      expect(cleanHtml).toContain('<em>italic</em>');
      expect(cleanHtml).toContain('<u>underlined</u>');

      // Should not contain the original span tags
      expect(cleanHtml).not.toContain('<span');
    });

    test('should clean up Google redirect URLs', async () => {
      await cleanHtmlPage.goto();

      const htmlWithGoogleRedirect = `
        <p>Check out <a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage&amp;source=gmail">this link</a></p>
      `;

      await cleanHtmlPage.processHtml(htmlWithGoogleRedirect);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should extract the original URL from Google's wrapped URL
      expect(cleanHtml).toContain('href="https://example.com/page"');

      // Should not contain Google redirect URL
      await cleanHtmlPage.expectGoogleRedirectsClean();
    });

    test('should prettify and format HTML output', async () => {
      await cleanHtmlPage.goto();

      const uglyHtml = '<div><p>Ugly<b>formatting</b></p><ul><li>Item 1</li><li>Item 2</li></ul></div>';

      await cleanHtmlPage.processHtml(uglyHtml);

      // Should be prettified with proper indentation
      await cleanHtmlPage.expectHtmlPrettified();
    });

    test('should handle empty input gracefully', async () => {
      await cleanHtmlPage.goto();

      // Enter empty input and click clean
      await cleanHtmlPage.enterRawHtml('');
      await cleanHtmlPage.cleanButton.click();

      // With empty input, the app should NOT show the output section
      // This is correct UX behavior - only show output when there's content
      await cleanHtmlPage.expectInitialState();
    });

    test('should handle malformed HTML', async () => {
      await cleanHtmlPage.goto();

      const malformedHtml = '<p>Unclosed paragraph<div>Mixed tags<span>No closing tags';

      await cleanHtmlPage.processHtml(malformedHtml);

      // Should still produce output without throwing errors
      await cleanHtmlPage.expectOutputState();

      // Should contain the text content
      await cleanHtmlPage.expectCleanHtmlContains('Unclosed paragraph');
      await cleanHtmlPage.expectCleanHtmlContains('Mixed tags');

      // Note: sanitize-html handles malformed input gracefully
    });
  });

  test.describe('Copy Functionality', () => {
    test('should enable copy button after processing', async () => {
      await cleanHtmlPage.goto();

      await cleanHtmlPage.processHtml('<p>Test content</p>');

      // Copy button should be enabled initially
      await cleanHtmlPage.expectCopyButtonEnabled();
    });

    test('should change copy button state when clicked', async () => {
      await cleanHtmlPage.goto();

      await cleanHtmlPage.processHtml('<p>Test content</p>');

      await test.step('Click copy button', async () => {
        await cleanHtmlPage.clickCopyButton();
      });

      await test.step('Verify button state changed', async () => {
        await cleanHtmlPage.expectCopyButtonDisabled();
      });
    });

    // Note: We can't test actual clipboard functionality in Playwright easily
    // without additional setup, but we can test the UI state changes
  });

  test.describe('Start Again Functionality', () => {
    test('should return to initial state when start again is clicked', async () => {
      await cleanHtmlPage.goto();

      const testHtml = '<p>Some test content</p>';

      await test.step('Process HTML', async () => {
        await cleanHtmlPage.processHtml(testHtml);
        await cleanHtmlPage.expectOutputState();
      });

      await test.step('Click start again', async () => {
        await cleanHtmlPage.clickStartAgain();
      });

      await test.step('Verify returned to initial state', async () => {
        await cleanHtmlPage.expectInitialState();

        // Input should be cleared
        const inputValue = await cleanHtmlPage.getRawHtmlInput();
        expect(inputValue).toBe('');
      });
    });

    test('should maintain focus on input after start again', async () => {
      await cleanHtmlPage.goto();

      await cleanHtmlPage.processHtml('<p>Test</p>');
      await cleanHtmlPage.clickStartAgain();

      // Input should be focused for immediate use
      await cleanHtmlPage.expectInputFocused();
    });
  });

  test.describe('Original HTML Details', () => {
    test('should show original HTML when details is expanded', async () => {
      await cleanHtmlPage.goto();

      const originalHtml = '<div><p>Original <span>content</span></p></div>';

      await cleanHtmlPage.processHtml(originalHtml);

      await test.step('Verify details element exists', async () => {
        await expect(cleanHtmlPage.originalHtmlDetails).toBeVisible();
      });

      await test.step('Click to expand and verify content', async () => {
        await cleanHtmlPage.originalHtmlDetails.click();

        // Just verify the content is present in the DOM, regardless of visibility
        const content = await cleanHtmlPage.originalHtmlContent.textContent();
        expect(content || '').toContain(originalHtml);
      });
    });
  });

  test.describe('Complex Real-World Examples', () => {
    test('should handle Word document paste with multiple issues', async () => {
      await cleanHtmlPage.goto();

      // Simulate HTML from Word with common issues
      const wordHtml = `
        <div style="margin: 0px;">
          <p><span style="font-family: Calibri; font-size: 11pt;">
            <span style="font-weight:700">Important Notice:</span>
            Please visit our
            <a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fhelp&amp;source=gmail">
              help page
            </a> for assistance.
          </span></p>
          <div style="background: yellow;">
            <span style="font-style:italic">Thank you!</span>
          </div>
        </div>
      `;

      await cleanHtmlPage.processHtml(wordHtml);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should remove divs and spans
      expect(cleanHtml).not.toContain('<div');
      expect(cleanHtml).not.toContain('<span');

      // Should preserve semantic content
      expect(cleanHtml).toContain('<strong>Important Notice:</strong>');
      expect(cleanHtml).toContain('<em>Thank you!</em>');
      expect(cleanHtml).toContain('href="https://example.com/help"');

      // Should clean Google redirect
      expect(cleanHtml).not.toContain('google.com/url?q=');
    });

    test('should handle realistic Word document with extensive formatting', async () => {
      await cleanHtmlPage.goto();

      await cleanHtmlPage.processHtml(testData.htmlSamples.wordDocument);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should preserve heading structure
      expect(cleanHtml).toContain('<h1>');
      expect(cleanHtml).toContain('<h2>');
      expect(cleanHtml).toContain('<h3>');
      expect(cleanHtml).toContain('<h4>');

      // Should preserve list structure
      expect(cleanHtml).toContain('<ul>');
      expect(cleanHtml).toContain('<ol>');
      expect(cleanHtml).toContain('<li>');

      // Should remove all span tags
      expect(cleanHtml).not.toContain('<span');

      // Should preserve heading content
      expect(cleanHtml).toContain('Heading one');
      expect(cleanHtml).toContain('Heading two');
      expect(cleanHtml).toContain('Heading three');
      expect(cleanHtml).toContain('Heading 4');

      // Should preserve list content
      expect(cleanHtml).toContain('Bullet');
      expect(cleanHtml).toContain('Numbered');
      expect(cleanHtml).toContain('Items');

      // Should preserve semantic formatting
      expect(cleanHtml).toContain('<strong>Proident</strong>');
      expect(cleanHtml).toContain('<i>officia</i>'); // <i> tags are preserved, not converted to <em>
      expect(cleanHtml).toContain('<u>eiusmod</u>');

      // Should preserve links
      expect(cleanHtml).toContain('href="https://google.com/"');
    });

    test('should handle Google Docs document with extreme span nesting', async () => {
      await cleanHtmlPage.goto();

      await cleanHtmlPage.processHtml(testData.htmlSamples.googleDocsDocument);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should preserve heading structure
      expect(cleanHtml).toContain('<h1>');
      expect(cleanHtml).toContain('<h2>');
      expect(cleanHtml).toContain('<h3>');

      // Should completely remove span tags (Google Docs creates massive nesting)
      expect(cleanHtml).not.toContain('<span');

      // Should preserve heading content
      expect(cleanHtml).toContain('Heading one');
      expect(cleanHtml).toContain('Heading two');
      expect(cleanHtml).toContain('Heading three');

      // Should preserve list structure and content
      expect(cleanHtml).toContain('<ul>');
      expect(cleanHtml).toContain('<ol>');
      expect(cleanHtml).toContain('Bullet');
      expect(cleanHtml).toContain('Point');
      expect(cleanHtml).toContain('Numbered');

      // Should handle complex formatting combinations
      expect(cleanHtml).toContain('Proident');
      expect(cleanHtml).toContain('officia');
      expect(cleanHtml).toContain('excepteur');
      expect(cleanHtml).toContain('tempor');

      // Should preserve paragraph structure
      expect(cleanHtml).toContain('<p>');

      // Should handle superscript and subscript
      expect(cleanHtml).toContain('<sup>');
      expect(cleanHtml).toContain('<sub>');

      // Should clean up empty paragraphs and whitespace
      const lines = cleanHtml.split('\n').filter(line => line.trim());
      const emptyParagraphs = lines.filter(line => line.trim() === '<p></p>' || line.trim() === '<p>&nbsp;</p>');
      expect(emptyParagraphs.length).toBeLessThan(3); // Should clean up most empty paragraphs
    });

    test('should handle Google Docs paste with simple formatting', async () => {
      await cleanHtmlPage.goto();

      // Simulate simpler Google Docs HTML
      const googleDocsHtml = `
        <div dir="ltr">
          <p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">
            <span style="font-size:12pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">
              Regular text with
            </span>
            <span style="font-size:12pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:700;font-style:normal;">
              bold formatting
            </span>
            <span style="font-size:12pt;font-family:Arial;color:#000000;">
               and more text.
            </span>
          </p>
        </div>
      `;

      await cleanHtmlPage.processHtml(googleDocsHtml);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Should remove divs and spans but preserve paragraph
      expect(cleanHtml).not.toContain('<div');
      expect(cleanHtml).not.toContain('<span');
      expect(cleanHtml).toContain('<p>');

      // Should convert font-weight:700 span to strong (may have spaces)
      expect(cleanHtml).toMatch(/<strong>\s*bold formatting\s*<\/strong>/);

      // Should preserve text content
      expect(cleanHtml).toContain('Regular text with');
      expect(cleanHtml).toContain('and more text');
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle very large HTML input', async () => {
      await cleanHtmlPage.goto();

      // Create a large HTML string
      const largeHtml = '<div>' + '<p>Large content </p>'.repeat(1000) + '</div>';

      await cleanHtmlPage.processHtml(largeHtml);

      // Should still process successfully
      await cleanHtmlPage.expectOutputState();
      await cleanHtmlPage.expectCleanHtmlContains('Large content');
    });

    test('should handle HTML with special characters', async () => {
      await cleanHtmlPage.goto();

      const specialCharHtml = '<p>&amp; &lt; &gt; &quot; &#x27; unicode: 你好 🌟</p>';

      await cleanHtmlPage.processHtml(specialCharHtml);

      await cleanHtmlPage.expectCleanHtmlContains('&amp;');
      await cleanHtmlPage.expectCleanHtmlContains('&lt;');
      await cleanHtmlPage.expectCleanHtmlContains('你好');
      await cleanHtmlPage.expectCleanHtmlContains('🌟');
    });

    test('should handle script and style tags properly', async () => {
      await cleanHtmlPage.goto();

      const htmlWithScripts = `
        <p>Safe content</p>
        <script>alert('xss');</script>
        <style>body { background: red; }</style>
        <p>More safe content</p>
      `;

      await cleanHtmlPage.processHtml(htmlWithScripts);

      const cleanHtml = await cleanHtmlPage.getCleanHtmlOutput();

      // Script and style tags should be removed by sanitize-html
      expect(cleanHtml).not.toContain('<script');
      expect(cleanHtml).not.toContain('<style');
      expect(cleanHtml).not.toContain('alert(');

      // Safe content should remain
      expect(cleanHtml).toContain('Safe content');
      expect(cleanHtml).toContain('More safe content');
    });
  });
});