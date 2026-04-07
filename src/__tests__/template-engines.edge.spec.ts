import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { EjsTemplateEngine } from '../engines/ejs.engine';
import { HandlebarsTemplateEngine } from '../engines/handlebars.engine';
import { PugTemplateEngine } from '../engines/pug.engine';
import { TEMPLATE_ENGINE } from '../constants/template.constants';

describe('Template Engines Edge Cases', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestjs-mailable-template-engines-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('EJS compile() returns a callable renderer', async () => {
    const engine = new EjsTemplateEngine(tempDir, 'main.ejs');
    const compiled = await engine.compile('Hello <%= name %>');

    expect(compiled({ name: 'Ada' })).toBe('Hello Ada');
  });

  it('wraps EJS compile errors', async () => {
    const engine = new EjsTemplateEngine(tempDir, 'main.ejs');
    await expect(engine.compile('<% if (name) { %>missing-close')).rejects.toThrow('Failed to compile EJS template:');
  });

  it('applies EJS options configuration path without throwing', async () => {
    await fs.writeFile(path.join(tempDir, 'main.ejs'), 'Hello <%= name %>', 'utf8');
    const engine = new EjsTemplateEngine(tempDir, 'main.ejs', {
      engine: TEMPLATE_ENGINE.EJS,
      directory: tempDir,
      options: {
        strict: false,
      },
    });

    await expect(engine.render('main', { name: 'Ada' })).resolves.toBe('Hello Ada');
  });

  it('Pug compile() returns a callable renderer', async () => {
    const engine = new PugTemplateEngine(tempDir, 'main.pug');
    const compiled = await engine.compile('p Hello #{name}');

    expect(compiled({ name: 'Ada' })).toBe('<p>Hello Ada</p>');
  });

  it('applies Pug options configuration path without throwing', async () => {
    await fs.writeFile(path.join(tempDir, 'main.pug'), 'p Hello #{name}', 'utf8');
    const engine = new PugTemplateEngine(tempDir, 'main.pug', {
      engine: TEMPLATE_ENGINE.PUG,
      directory: tempDir,
      options: {
        compileDebug: false,
      },
    });

    await expect(engine.render('main', { name: 'Ada' })).resolves.toBe('<p>Hello Ada</p>');
  });

  it('Handlebars compile() returns a callable renderer', async () => {
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');
    const compiled = await engine.compile('Hello {{name}}');

    expect(compiled({ name: 'Ada' })).toBe('Hello Ada');
  });

  it('wraps render errors with engine-specific EJS context', async () => {
    const engine = new EjsTemplateEngine(tempDir, 'main.ejs');

    await expect(engine.render('missing', { name: 'Ada' })).rejects.toThrow("Failed to render EJS template 'missing'");
  });

  it('wraps render errors with engine-specific Pug context', async () => {
    const engine = new PugTemplateEngine(tempDir, 'main.pug');

    await expect(engine.render('missing', { name: 'Ada' })).rejects.toThrow("Failed to render Pug template 'missing'");
  });

  it('wraps render errors with engine-specific Handlebars context', async () => {
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');

    await expect(engine.render('missing', { name: 'Ada' })).rejects.toThrow(
      "Failed to render Handlebars template 'missing'",
    );
  });

  it('registers helper wrapper that falls back when helper throws', async () => {
    const templatePath = path.join(tempDir, 'main.hbs');
    await fs.writeFile(templatePath, '{{explode name}}', 'utf8');

    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs', {
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: tempDir,
      options: {
        helpers: {
          explode: () => {
            throw new Error('boom');
          },
        },
      },
    });

    await expect(engine.render('main', { name: 'Ada' })).resolves.toBe('Ada');
  });

  it('helper wrapper falls back to empty string when helper throws without args', async () => {
    const templatePath = path.join(tempDir, 'main.hbs');
    await fs.writeFile(templatePath, '{{explode}}', 'utf8');

    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs', {
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: tempDir,
      options: {
        helpers: {
          explode: () => {
            throw new Error('boom');
          },
        },
      },
    });

    await expect(engine.render('main', {})).resolves.toBe('[object Object]');
  });

  it('helper wrapper falls back to empty string when first helper argument is falsy', async () => {
    const templatePath = path.join(tempDir, 'main.hbs');
    await fs.writeFile(templatePath, '{{explode ""}}', 'utf8');

    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs', {
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: tempDir,
      options: {
        helpers: {
          explode: () => {
            throw new Error('boom');
          },
        },
      },
    });

    await expect(engine.render('main', {})).resolves.toBe('');
  });

  it('registerPartialFromFile silently ignores missing partial files', async () => {
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');

    await expect(engine.registerPartialFromFile('header', 'missing-partial')).resolves.toBeUndefined();
  });

  it('registerPartial registers partial content directly', async () => {
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');

    expect(() => engine.registerPartial('header', '<h1>{{title}}</h1>')).not.toThrow();
  });

  it('registerPartialFromFile loads and registers existing partials', async () => {
    await fs.writeFile(path.join(tempDir, 'header.hbs'), '<h1>{{title}}</h1>', 'utf8');
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');

    await expect(engine.registerPartialFromFile('header', 'header')).resolves.toBeUndefined();
  });

  it('initializes Handlebars cache with default maxSize and skips re-configure when already configured', async () => {
    const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs', {
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: tempDir,
      cache: {
        enabled: true,
      },
    });

    expect(() =>
      (engine as any).configureEngine({ engine: TEMPLATE_ENGINE.HANDLEBARS, directory: tempDir }),
    ).not.toThrow();
  });
});
