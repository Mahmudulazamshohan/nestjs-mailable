import { Injectable } from '@nestjs/common';
import { BaseTemplateEngine, ensurePackageAvailable } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';
import { LruCache } from '../cache/lru-cache';

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
  private compiledFns: LruCache<string, (ctx: Record<string, unknown>) => string> | null = null;

  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'pug');
    if (!pug) {
      throw new Error('Pug template engine is not available. Please install it with: npm install pug');
    }

    if (config?.cache?.enabled) {
      this.compiledFns = new LruCache(config.cache.maxSize ?? 100, config.cache.ttl);
      this.initSourceCache(config.cache);
    }

    if (config) {
      this.configureEngine(config);
    }
  }

  private configureEngine(config: TemplateConfiguration): void {
    if (config.options) {
      this.pugOptions = { ...config.options };
    }
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    try {
      const templatePath = this.resolveTemplatePath(template);

      if (this.compiledFns) {
        let fn = this.compiledFns.get(template);
        if (!fn) {
          const source = await this.loadTemplate(template);
          fn = pug.compile(source, { filename: templatePath, pretty: false, ...this.pugOptions });
          this.compiledFns.set(template, fn);
        }
        return fn(context);
      }

      const templateSource = await this.loadTemplate(template);
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
