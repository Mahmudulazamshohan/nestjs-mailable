import { Injectable } from '@nestjs/common';
import { BaseTemplateEngine, ensurePackageAvailable } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ejs: any;

try {
  ejs = ensurePackageAvailable('ejs');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_error) {
  // EJS not available - error will be thrown in constructor
}

@Injectable()
export class EjsTemplateEngine extends BaseTemplateEngine {
  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'ejs');
    if (!ejs) {
      throw new Error('EJS template engine is not available. Please install it with: npm install ejs');
    }

    if (config) {
      this.configureEngine(config);
    }
  }

  private configureEngine(config: TemplateConfiguration): void {
    // EJS doesn't have built-in partials or helpers like Handlebars
    // But we can store config for potential future use
    if (config.options) {
      // Store options for potential use in render method
    }
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    try {
      const templateSource = await this.loadTemplate(template);
      const templatePath = this.resolveTemplatePath(template);

      return ejs.render(templateSource, context, {
        filename: templatePath,
        rmWhitespace: false,
      });
    } catch (error) {
      throw new Error(`Failed to render EJS template '${template}': ${(error as Error).message}`);
    }
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    try {
      return (context: Record<string, unknown>) => {
        return ejs.render(source, context, { rmWhitespace: false });
      };
    } catch (error) {
      throw new Error(`Failed to compile EJS template: ${(error as Error).message}`);
    }
  }
}
