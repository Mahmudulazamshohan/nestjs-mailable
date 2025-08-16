/**
 * @interface TemplateAdapter
 * @description Defines the contract for template engine adapters.
 *              Implementations of this interface are responsible for compiling
 *              email templates using a specific templating language (e.g., EJS, Handlebars, Pug).
 */
export interface TemplateAdapter {
  /**
   * @method compile
   * @description Compiles a given template string with the provided context data.
   * @param template The template string to compile.
   * @param context A record of key-value pairs representing the data to be injected into the template.
   * @returns A Promise that resolves with the compiled HTML string.
   */
  compile(template: string, context: Record<string, any>): Promise<string>;
}
