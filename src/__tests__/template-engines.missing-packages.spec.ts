import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { HandlebarsTemplateEngine } from '../engines/handlebars.engine';
import { PugTemplateEngine } from '../engines/pug.engine';

describe('Template engines missing package and error branches', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws constructor error when EJS package cannot be loaded', () => {
    jest.isolateModules(() => {
      jest.doMock('../engines/base.engine', () => {
        const actual = jest.requireActual('../engines/base.engine');
        return {
          ...actual,
          ensurePackageAvailable: jest.fn(() => {
            throw new Error('missing');
          }),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { EjsTemplateEngine } = require('../engines/ejs.engine');
      expect(() => new EjsTemplateEngine('.', 'main.ejs')).toThrow(
        'EJS template engine is not available. Please install it with: npm install ejs',
      );
    });
  });

  it('throws constructor error when Pug package cannot be loaded', () => {
    jest.isolateModules(() => {
      jest.doMock('../engines/base.engine', () => {
        const actual = jest.requireActual('../engines/base.engine');
        return {
          ...actual,
          ensurePackageAvailable: jest.fn(() => {
            throw new Error('missing');
          }),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PugTemplateEngine } = require('../engines/pug.engine');
      expect(() => new PugTemplateEngine('.', 'main.pug')).toThrow(
        'Pug template engine is not available. Please install it with: npm install pug',
      );
    });
  });

  it('throws constructor error when Handlebars package cannot be loaded', () => {
    jest.isolateModules(() => {
      jest.doMock('../engines/base.engine', () => {
        const actual = jest.requireActual('../engines/base.engine');
        return {
          ...actual,
          ensurePackageAvailable: jest.fn(() => {
            throw new Error('missing');
          }),
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { HandlebarsTemplateEngine } = require('../engines/handlebars.engine');
      expect(() => new HandlebarsTemplateEngine('.', 'main.hbs')).toThrow(
        'Handlebars template engine is not available. Please install it with: npm install handlebars',
      );
    });
  });

  it('wraps Handlebars compile errors', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestjs-mailable-hbs-compile-'));
    try {
      const engine = new HandlebarsTemplateEngine(tempDir, 'main.hbs');
      (engine as any).handlebars.compile = jest.fn(() => {
        throw new Error('bad compile');
      });

      await expect(engine.compile('hello')).rejects.toThrow('Failed to compile Handlebars template: bad compile');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('wraps Pug compile errors', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestjs-mailable-pug-compile-'));
    try {
      const engine = new PugTemplateEngine(tempDir, 'main.pug');
      await expect(engine.compile('p #{')).rejects.toThrow('Failed to compile Pug template:');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
