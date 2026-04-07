import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { HandlebarsTemplateEngine } from '../engines/handlebars.engine';
import { EjsTemplateEngine } from '../engines/ejs.engine';
import { PugTemplateEngine } from '../engines/pug.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';
import { TEMPLATE_ENGINE } from '../constants/template.constants';

type EngineFactory = (
  templateDir: string,
  config?: TemplateConfiguration,
) => {
  render(template: string, context: Record<string, unknown>): Promise<string>;
};

describe('Template engine cache integration', () => {
  const tempRoot = path.join(os.tmpdir(), `nestjs-mailable-template-cache-${process.pid}`);

  beforeAll(async () => {
    await fs.mkdir(tempRoot, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  async function withTemplateDir<T>(
    name: string,
    fileName: string,
    initialContent: string,
    run: (dir: string, filePath: string) => Promise<T>,
  ): Promise<T> {
    const dir = path.join(tempRoot, name);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, initialContent, 'utf8');
    return run(dir, filePath);
  }

  describe.each([
    {
      name: 'EJS',
      fileName: 'welcome.ejs',
      engine: TEMPLATE_ENGINE.EJS,
      create: ((dir: string, config?: TemplateConfiguration) =>
        new EjsTemplateEngine(dir, 'main.ejs', config)) as EngineFactory,
      initialTemplate: 'Hello <%= name %>',
      updatedTemplate: 'Updated <%= name %>',
      initialOutput: 'Hello Ada',
      updatedOutput: 'Updated Grace',
      cachedOutput: 'Hello Grace',
    },
    {
      name: 'Pug',
      fileName: 'welcome.pug',
      engine: TEMPLATE_ENGINE.PUG,
      create: ((dir: string, config?: TemplateConfiguration) =>
        new PugTemplateEngine(dir, 'main.pug', config)) as EngineFactory,
      initialTemplate: 'p Hello #{name}',
      updatedTemplate: 'p Updated #{name}',
      initialOutput: '<p>Hello Ada</p>',
      updatedOutput: '<p>Updated Grace</p>',
      cachedOutput: '<p>Hello Grace</p>',
    },
  ])(
    '$name',
    ({ fileName, engine, create, initialTemplate, updatedTemplate, initialOutput, updatedOutput, cachedOutput }) => {
      it('reuses the cached compiled template when cache is enabled', async () => {
        await withTemplateDir(`${engine}-cached`, fileName, initialTemplate, async (dir, filePath) => {
          const templateConfig: TemplateConfiguration = {
            engine,
            directory: dir,
            cache: {
              enabled: true,
              maxSize: 10,
            },
          };

          const templateEngine = create(dir, templateConfig);

          expect(await templateEngine.render('welcome', { name: 'Ada' })).toBe(initialOutput);

          await fs.writeFile(filePath, updatedTemplate, 'utf8');

          expect(await templateEngine.render('welcome', { name: 'Grace' })).toBe(cachedOutput);
        });
      });

      it('reloads the template from disk when cache is disabled', async () => {
        await withTemplateDir(`${engine}-uncached`, fileName, initialTemplate, async (dir, filePath) => {
          const templateConfig: TemplateConfiguration = {
            engine,
            directory: dir,
          };

          const templateEngine = create(dir, templateConfig);

          expect(await templateEngine.render('welcome', { name: 'Ada' })).toBe(initialOutput);

          await fs.writeFile(filePath, updatedTemplate, 'utf8');

          expect(await templateEngine.render('welcome', { name: 'Grace' })).toBe(updatedOutput);
        });
      });
    },
  );

  it('evicts least-recently-used Handlebars compiled templates when cache is bounded', async () => {
    const dir = path.join(tempRoot, 'handlebars-lru');
    await fs.mkdir(dir, { recursive: true });

    const firstTemplate = path.join(dir, 'first.hbs');
    const secondTemplate = path.join(dir, 'second.hbs');

    await fs.writeFile(firstTemplate, 'Hello {{name}}', 'utf8');
    await fs.writeFile(secondTemplate, 'Second {{name}}', 'utf8');

    const templateEngine = new HandlebarsTemplateEngine(dir, 'main.hbs', {
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: dir,
      cache: {
        enabled: true,
        maxSize: 1,
      },
    });

    expect(await templateEngine.render('first', { name: 'Ada' })).toBe('Hello Ada');
    expect(await templateEngine.render('second', { name: 'Grace' })).toBe('Second Grace');

    await fs.writeFile(firstTemplate, 'Updated {{name}}', 'utf8');

    expect(await templateEngine.render('first', { name: 'Lin' })).toBe('Updated Lin');
  });

  it('uses default cache size when Pug cache is enabled without maxSize', async () => {
    const dir = path.join(tempRoot, 'pug-default-cache-size');
    await fs.mkdir(dir, { recursive: true });
    const templatePath = path.join(dir, 'welcome.pug');
    await fs.writeFile(templatePath, 'p Hello #{name}', 'utf8');

    const engine = new PugTemplateEngine(dir, 'main.pug', {
      engine: TEMPLATE_ENGINE.PUG,
      directory: dir,
      cache: {
        enabled: true,
      },
    });

    expect(await engine.render('welcome', { name: 'Ada' })).toBe('<p>Hello Ada</p>');
  });

  it('uses default cache size when EJS cache is enabled without maxSize', async () => {
    const dir = path.join(tempRoot, 'ejs-default-cache-size');
    await fs.mkdir(dir, { recursive: true });
    const templatePath = path.join(dir, 'welcome.ejs');
    await fs.writeFile(templatePath, 'Hello <%= name %>', 'utf8');

    const engine = new EjsTemplateEngine(dir, 'main.ejs', {
      engine: TEMPLATE_ENGINE.EJS,
      directory: dir,
      cache: {
        enabled: true,
      },
    });

    expect(await engine.render('welcome', { name: 'Ada' })).toBe('Hello Ada');
  });
});
