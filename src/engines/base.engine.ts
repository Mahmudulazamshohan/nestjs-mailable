import { TemplateEngine } from '../interfaces/mail.interface';
import * as path from 'path';
import { promises as fs } from 'fs';

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
  constructor(
    protected templateDir: string,
    protected mainFile: string,
    protected extension: string,
  ) {}

  abstract render(template: string, context: Record<string, unknown>): Promise<string>;
  abstract compile(source: string): Promise<(context: Record<string, unknown>) => string>;

  protected resolveTemplatePath(template: string): string {
    let templatePath = template || this.mainFile;

    if (!templatePath.endsWith(`.${this.extension}`)) {
      templatePath += `.${this.extension}`;
    }

    return path.join(this.templateDir, templatePath);
  }

  protected async loadTemplate(template: string): Promise<string> {
    try {
      const filePath = this.resolveTemplatePath(template);
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load template file '${template}': ${(error as Error).message}`);
    }
  }
}
