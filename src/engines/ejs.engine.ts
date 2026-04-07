import { Injectable } from '@nestjs/common';
import { BaseTemplateEngine, ensurePackageAvailable } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';
import { LruCache } from '../cache/lru-cache';

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
  private compiledFns: LruCache<string, (ctx: Record<string, unknown>) => string> | null = null;
  private ejsOptions: Record<string, unknown> = {};

  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'ejs');
    if (!ejs) {
      throw new Error('EJS template engine is not available. Please install it with: npm install ejs');
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
      this.ejsOptions = { ...config.options };
    }
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    try {
      const templatePath = this.resolveTemplatePath(template);

      if (this.compiledFns) {
        let fn = this.compiledFns.get(template);
        if (!fn) {
          const source = await this.loadTemplate(template);
          const compiled = ejs.compile(source, { filename: templatePath, rmWhitespace: false, ...this.ejsOptions });
          fn = (ctx: Record<string, unknown>) => compiled(ctx);
          this.compiledFns.set(template, fn);
        }
        return fn(context);
      }

      const templateSource = await this.loadTemplate(template);
      return ejs.render(templateSource, context, {
        filename: templatePath,
        rmWhitespace: false,
        ...this.ejsOptions,
      });
    } catch (error) {
      throw new Error(`Failed to render EJS template '${template}': ${(error as Error).message}`);
    }
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    try {
      const compiled = ejs.compile(source, { rmWhitespace: false, ...this.ejsOptions });
      return (context: Record<string, unknown>) => compiled(context);
    } catch (error) {
      throw new Error(`Failed to compile EJS template: ${(error as Error).message}`);
    }
  }
}
