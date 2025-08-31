import { Injectable } from '@nestjs/common';
import { BaseTemplateEngine, ensurePackageAvailable } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HandlebarsLib: any;

try {
  HandlebarsLib = ensurePackageAvailable('handlebars');
} catch (error) {
  console.warn('Handlebars not available:', (error as Error).message);
}

@Injectable()
export class HandlebarsTemplateEngine extends BaseTemplateEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private compiledTemplates = new Map<string, any>();
  private isConfigured = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlebars: any;

  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'hbs');
    if (!HandlebarsLib) {
      throw new Error('Handlebars template engine is not available. Please install it with: npm install handlebars');
    }

    // Create a new Handlebars instance for this template engine
    this.handlebars = HandlebarsLib.create();

    if (config) {
      this.configureEngine(config);
    }
  }

  private configureEngine(config: TemplateConfiguration): void {
    if (this.isConfigured) return;

    // Register helpers
    if (config.options?.helpers) {
      Object.entries(config.options.helpers).forEach(([name, helper]) => {
        this.registerHelper(name, helper);
      });
    }

    // Register partials
    if (config.partials) {
      Object.entries(config.partials).forEach(([name, partialPath]) => {
        this.registerPartialFromFile(name, partialPath);
      });
    }

    this.isConfigured = true;
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    try {
      let compiledTemplate = this.compiledTemplates.get(template);
      if (!compiledTemplate) {
        const templateSource = await this.loadTemplate(template);
        compiledTemplate = this.handlebars.compile(templateSource);
        this.compiledTemplates.set(template, compiledTemplate);
      }
      return compiledTemplate(context);
    } catch (error) {
      throw new Error(`Failed to render Handlebars template '${template}': ${(error as Error).message}`);
    }
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    try {
      const compiledTemplate = this.handlebars.compile(source);
      return (context: Record<string, unknown>) => compiledTemplate(context);
    } catch (error) {
      throw new Error(`Failed to compile Handlebars template: ${(error as Error).message}`);
    }
  }

  registerHelper(name: string, helper: (...args: unknown[]) => unknown): void {
    if (this.handlebars) {
      // Wrap helper with error handling
      const safeHelper = (...args: unknown[]) => {
        try {
          return helper(...args);
        } catch (error) {
          console.warn(`Handlebars helper '${name}' error:`, (error as Error).message);
          return args[0] || ''; // Return the first argument or empty string as fallback
        }
      };
      this.handlebars.registerHelper(name, safeHelper);
    }
  }

  registerPartial(name: string, partial: string): void {
    if (this.handlebars) {
      this.handlebars.registerPartial(name, partial);
    }
  }

  async registerPartialFromFile(name: string, partialPath: string): Promise<void> {
    try {
      const partialContent = await this.loadTemplate(partialPath);
      this.registerPartial(name, partialContent);
    } catch (error) {
      console.warn(`Failed to load partial '${name}' from '${partialPath}':`, (error as Error).message);
    }
  }
}
