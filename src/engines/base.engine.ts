import { TemplateEngine, TemplateCacheConfiguration } from '../interfaces/mail.interface';
import * as path from 'path';
import { promises as fs } from 'fs';
import { LruCache } from '../cache/lru-cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensurePackageAvailable(packageName: string): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require(packageName);
  } catch {
    throw new Error(
      `Template engine package '${packageName}' is not installed. ` +
        `Please install it with: npm install ${packageName}`,
    );
  }
}

export abstract class BaseTemplateEngine implements TemplateEngine {
  private sourceCache: LruCache<string, string> | null = null;

  constructor(
    protected templateDir: string,
    protected mainFile: string,
    protected extension: string,
  ) {}

  abstract render(template: string, context: Record<string, unknown>): Promise<string>;
  abstract compile(source: string): Promise<(context: Record<string, unknown>) => string>;

  protected initSourceCache(config?: TemplateCacheConfiguration): void {
    if (config?.enabled) {
      this.sourceCache = new LruCache<string, string>(config.maxSize ?? 100, config.ttl);
    }
  }

  protected resolveTemplatePath(template: string): string {
    let templatePath = template || this.mainFile;

    if (!templatePath.endsWith(`.${this.extension}`)) {
      templatePath += `.${this.extension}`;
    }

    return path.join(this.templateDir, templatePath);
  }

  protected async loadTemplate(template: string): Promise<string> {
    try {
      if (this.sourceCache) {
        const cached = this.sourceCache.get(template);
        if (cached !== undefined) return cached;
      }

      const filePath = this.resolveTemplatePath(template);
      const source = await fs.readFile(filePath, 'utf8');

      if (this.sourceCache) {
        this.sourceCache.set(template, source);
      }

      return source;
    } catch (error) {
      throw new Error(`Failed to load template file '${template}': ${(error as Error).message}`);
    }
  }
}
