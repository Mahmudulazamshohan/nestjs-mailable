import {
  TemplateEngineFactory,
  HandlebarsTemplateEngine,
  MarkdownTemplateEngine,
  MjmlTemplateEngine,
} from '../services/template.service';
import { TemplateEngine } from '../interfaces/mail.interface';

// Mock file system
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

// Mock handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn().mockReturnValue(jest.fn().mockReturnValue('<h1>Mock Template</h1>')),
  registerHelper: jest.fn(),
  registerPartial: jest.fn(),
}));

// Mock marked
jest.mock('marked', () => ({
  marked: jest.fn().mockReturnValue('<p>Mock Markdown</p>'),
}));

// Mock mjml
jest.mock('mjml', () =>
  jest.fn().mockReturnValue({
    html: '<html><body>Mock MJML</body></html>',
    errors: [],
  }),
);

describe('Template Engines - Simple Tests', () => {
  const fs = jest.requireActual('fs');
  const Handlebars = jest.requireActual('handlebars');

  beforeEach(() => {
    jest.clearAllMocks();
    fs.promises.readFile.mockResolvedValue('<h1>{{title}}</h1><p>{{content}}</p>');
  });

  describe('HandlebarsTemplateEngine', () => {
    let engine: HandlebarsTemplateEngine;

    beforeEach(() => {
      engine = new HandlebarsTemplateEngine('./templates', 'default.hbs');
    });

    it('should create Handlebars template engine', () => {
      expect(engine).toBeInstanceOf(HandlebarsTemplateEngine);
    });

    it('should render template with context', async () => {
      const context = {
        title: 'Welcome',
        content: 'Hello World!',
      };

      const result = await engine.render('welcome', context);

      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(Handlebars.compile).toHaveBeenCalled();
      expect(result).toBe('<h1>Mock Template</h1>');
    });

    it('should compile template source', async () => {
      const source = '<h1>{{name}}</h1>';
      const templateFn = await engine.compile(source);

      expect(typeof templateFn).toBe('function');
      expect(Handlebars.compile).toHaveBeenCalledWith(source);
    });

    it('should register helpers', () => {
      const helper = (text: string): string => text.toUpperCase();
      engine.registerHelper('uppercase', helper);

      expect(Handlebars.registerHelper).toHaveBeenCalledWith('uppercase', helper);
    });

    it('should register partials', () => {
      engine.registerPartial('header', '<header>{{title}}</header>');

      expect(Handlebars.registerPartial).toHaveBeenCalledWith('header', '<header>{{title}}</header>');
    });
  });

  describe('MarkdownTemplateEngine', () => {
    let engine: MarkdownTemplateEngine;

    beforeEach(() => {
      engine = new MarkdownTemplateEngine('./templates', 'default.md');
    });

    it('should create Markdown template engine', () => {
      expect(engine).toBeInstanceOf(MarkdownTemplateEngine);
    });

    it('should render markdown template', async () => {
      const context = {
        title: 'Welcome',
        content: 'Hello World!',
      };

      const result = await engine.render('welcome', context);

      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(result).toBe('<h1>Mock Template</h1>');
    });
  });

  describe('MjmlTemplateEngine', () => {
    let engine: MjmlTemplateEngine;

    beforeEach(() => {
      engine = new MjmlTemplateEngine('./templates', 'default.mjml');
    });

    it('should create MJML template engine', () => {
      expect(engine).toBeInstanceOf(MjmlTemplateEngine);
    });

    it('should render MJML template', async () => {
      const context = {
        title: 'Welcome',
        content: 'Hello World!',
      };

      const result = await engine.render('welcome', context);

      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(result).toContain('<html><body>Mock MJML</body></html>');
    });
  });

  describe('TemplateEngineFactory', () => {
    let factory: TemplateEngineFactory;
    let mockEngine: TemplateEngine;

    beforeEach(() => {
      factory = new TemplateEngineFactory();
      mockEngine = {
        render: jest.fn().mockResolvedValue('<h1>Mock Engine</h1>'),
        compile: jest.fn().mockResolvedValue(() => '<h1>Mock Engine</h1>'),
      };
    });

    it('should create template engine factory', () => {
      expect(factory).toBeInstanceOf(TemplateEngineFactory);
    });

    it('should register template engine', () => {
      factory.registerEngine('custom', mockEngine);

      const engine = factory.getEngine('custom');
      expect(engine).toBe(mockEngine);
    });

    it('should throw error for unknown engine', () => {
      expect(() => factory.getEngine('unknown')).toThrow("Template engine 'unknown' not found");
    });

    it('should register multiple engines', () => {
      const handlebarsEngine = new HandlebarsTemplateEngine('./templates', 'default.hbs');
      const markdownEngine = new MarkdownTemplateEngine('./templates', 'default.md');
      const mjmlEngine = new MjmlTemplateEngine('./templates', 'default.mjml');

      factory.registerEngine('handlebars', handlebarsEngine);
      factory.registerEngine('markdown', markdownEngine);
      factory.registerEngine('mjml', mjmlEngine);

      expect(factory.getEngine('handlebars')).toBe(handlebarsEngine);
      expect(factory.getEngine('markdown')).toBe(markdownEngine);
      expect(factory.getEngine('mjml')).toBe(mjmlEngine);
    });

    it('should use engine through factory', async () => {
      factory.registerEngine('test', mockEngine);
      const engine = factory.getEngine('test');

      const result = await engine.render('template', { title: 'Test' });

      expect(mockEngine.render).toHaveBeenCalledWith('template', { title: 'Test' });
      expect(result).toBe('<h1>Mock Engine</h1>');
    });
  });
});
