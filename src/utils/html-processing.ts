import { convert, HtmlToTextOptions } from 'html-to-text';
// juice is CommonJS without a default export and tsconfig has no esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-require-imports
import juice = require('juice');

export type InlineCssOptions = juice.Options;

/** Derives a plain text alternative from HTML. */
export function htmlToPlainText(html: string, options?: HtmlToTextOptions): string {
  return convert(html, { wordwrap: 80, ...options });
}

/** Moves `<style>` rules onto elements as inline `style` attributes for email client compatibility. */
export function inlineCss(html: string, options?: InlineCssOptions): string {
  return juice(html, options);
}
