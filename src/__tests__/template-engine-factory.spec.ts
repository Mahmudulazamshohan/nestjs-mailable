import { TemplateEngineFactory } from '../services/template.service';
import { TemplateEngine } from '../interfaces/mail.interface';

describe('TemplateEngineFactory', () => {
  function createMockEngine(output: string): TemplateEngine {
    return {
      render: jest.fn().mockResolvedValue(output),
      compile: jest.fn().mockResolvedValue(() => output),
    };
  }

  it('registers and retrieves a supported engine', async () => {
    const factory = new TemplateEngineFactory();
    const engine = createMockEngine('ok');

    factory.registerEngine('handlebars', engine);
    const retrieved = factory.getEngine('handlebars');

    expect(retrieved).toBe(engine);
    await expect(retrieved.render('welcome', {})).resolves.toBe('ok');
  });

  it('throws when registering an unsupported engine', () => {
    const factory = new TemplateEngineFactory();
    const engine = createMockEngine('x');

    expect(() => factory.registerEngine('nunjucks', engine)).toThrow("Template engine 'nunjucks' is not supported");
  });

  it('throws when getting an unsupported engine type', () => {
    const factory = new TemplateEngineFactory();

    expect(() => factory.getEngine('liquid')).toThrow("Template engine 'liquid' is not supported");
  });

  it('throws when getting a supported engine that was not registered', () => {
    const factory = new TemplateEngineFactory();

    expect(() => factory.getEngine('ejs')).toThrow("Template engine 'ejs' is not registered");
  });

  it('returns a defensive copy from getSupportedEngines()', () => {
    const factory = new TemplateEngineFactory();

    const supported = factory.getSupportedEngines();
    supported.push('mutated');

    expect(factory.getSupportedEngines()).toEqual(['handlebars', 'ejs', 'pug']);
  });

  it('isEngineSupported() returns true only for known engines', () => {
    const factory = new TemplateEngineFactory();

    expect(factory.isEngineSupported('handlebars')).toBe(true);
    expect(factory.isEngineSupported('ejs')).toBe(true);
    expect(factory.isEngineSupported('pug')).toBe(true);
    expect(factory.isEngineSupported('liquid')).toBe(false);
  });
});
