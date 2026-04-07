import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { BaseTemplateEngine, ensurePackageAvailable } from '../engines/base.engine';
import { TemplateCacheConfiguration } from '../interfaces/mail.interface';

class TestTemplateEngine extends BaseTemplateEngine {
  constructor(templateDir: string, mainFile = 'main.hbs') {
    super(templateDir, mainFile, 'hbs');
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    const source = await this.loadTemplate(template);
    return source.replace('{{name}}', String(context.name ?? ''));
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    return (context: Record<string, unknown>): string => source.replace('{{name}}', String(context.name ?? ''));
  }

  enableSourceCache(config?: TemplateCacheConfiguration): void {
    this.initSourceCache(config);
  }

  resolve(template: string): string {
    return this.resolveTemplatePath(template);
  }

  load(template: string): Promise<string> {
    return this.loadTemplate(template);
  }
}

describe('BaseTemplateEngine', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestjs-mailable-base-engine-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('ensurePackageAvailable', () => {
    it('loads an installed package', () => {
      const pkg = ensurePackageAvailable('path');

      expect(pkg).toBeDefined();
      expect(typeof pkg.join).toBe('function');
    });

    it('throws a clear error for missing packages', () => {
      expect(() => ensurePackageAvailable('__definitely_not_installed_pkg__')).toThrow(
        "Template engine package '__definitely_not_installed_pkg__' is not installed",
      );
    });
  });

  describe('resolveTemplatePath', () => {
    it('uses main file when template name is empty', () => {
      const engine = new TestTemplateEngine(tempDir, 'main.hbs');

      expect(engine.resolve('')).toBe(path.join(tempDir, 'main.hbs'));
    });

    it('appends extension when missing', () => {
      const engine = new TestTemplateEngine(tempDir);

      expect(engine.resolve('welcome')).toBe(path.join(tempDir, 'welcome.hbs'));
    });

    it('keeps extension when already present', () => {
      const engine = new TestTemplateEngine(tempDir);

      expect(engine.resolve('welcome.hbs')).toBe(path.join(tempDir, 'welcome.hbs'));
    });
  });

  describe('loadTemplate', () => {
    it('loads source from disk', async () => {
      const engine = new TestTemplateEngine(tempDir);
      const filePath = path.join(tempDir, 'welcome.hbs');
      await fs.writeFile(filePath, 'Hello {{name}}', 'utf8');

      await expect(engine.load('welcome')).resolves.toBe('Hello {{name}}');
    });

    it('reuses cached source when cache is enabled', async () => {
      const engine = new TestTemplateEngine(tempDir);
      engine.enableSourceCache({ enabled: true, maxSize: 5 });

      const filePath = path.join(tempDir, 'welcome.hbs');
      await fs.writeFile(filePath, 'Hello {{name}}', 'utf8');
      await expect(engine.load('welcome')).resolves.toBe('Hello {{name}}');

      await fs.writeFile(filePath, 'Updated {{name}}', 'utf8');

      await expect(engine.load('welcome')).resolves.toBe('Hello {{name}}');
    });

    it('uses default cache maxSize when enabled without explicit maxSize', async () => {
      const engine = new TestTemplateEngine(tempDir);
      engine.enableSourceCache({ enabled: true });

      const filePath = path.join(tempDir, 'default-cache.hbs');
      await fs.writeFile(filePath, 'Default {{name}}', 'utf8');
      await expect(engine.load('default-cache')).resolves.toBe('Default {{name}}');

      await fs.writeFile(filePath, 'Updated {{name}}', 'utf8');
      await expect(engine.load('default-cache')).resolves.toBe('Default {{name}}');
    });

    it('throws a wrapped error when template file cannot be loaded', async () => {
      const engine = new TestTemplateEngine(tempDir);

      await expect(engine.load('missing')).rejects.toThrow("Failed to load template file 'missing'");
    });
  });
});
