import { Injectable } from '@nestjs/common';
import { BaseTemplateEngine, ensurePackageAvailable } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pug: any;

try {
  pug = ensurePackageAvailable('pug');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_error) {
  // Pug not available - error will be thrown in constructor
}

@Injectable()
export class PugTemplateEngine extends BaseTemplateEngine {
  private pugOptions: Record<string, unknown> = {};

  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'pug');
    if (!pug) {
      throw new Error('Pug template engine is not available. Please install it with: npm install pug');
    }

    if (config) {
      this.configureEngine(config);
    }
  }

  private configureEngine(config: TemplateConfiguration): void {
    // Pug supports options and can handle custom filters/mixins
    if (config.options) {
      this.pugOptions = { ...config.options };
    }
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    try {
      const templateSource = await this.loadTemplate(template);
      const templatePath = this.resolveTemplatePath(template);

      const compiledTemplate = pug.compile(templateSource, {
        filename: templatePath,
        pretty: false,
        ...this.pugOptions,
      });
      return compiledTemplate(context);
    } catch (error) {
      throw new Error(`Failed to render Pug template '${template}': ${(error as Error).message}`);
    }
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    try {
      const compiledTemplate = pug.compile(source, { pretty: false, ...this.pugOptions });
      return (context: Record<string, unknown>) => compiledTemplate(context);
    } catch (error) {
      throw new Error(`Failed to compile Pug template: ${(error as Error).message}`);
    }
  }
}
