import { Injectable } from '@nestjs/common';
import { TemplateEngine } from '../interfaces/mail.interface';
import { HandlebarsTemplateEngine, EjsTemplateEngine, PugTemplateEngine } from '../engines';

export { HandlebarsTemplateEngine, EjsTemplateEngine, PugTemplateEngine };

// Template Engine Factory
@Injectable()
export class TemplateEngineFactory {
  private engines = new Map<string, TemplateEngine>();
  private readonly SUPPORTED_ENGINES = ['handlebars', 'ejs', 'pug'];

  registerEngine(type: string, engine: TemplateEngine): void {
    if (!this.SUPPORTED_ENGINES.includes(type)) {
      throw new Error(
        `Template engine '${type}' is not supported. Supported engines: ${this.SUPPORTED_ENGINES.join(', ')}`,
      );
    }
    this.engines.set(type, engine);
  }

  getEngine(type: string): TemplateEngine {
    if (!this.SUPPORTED_ENGINES.includes(type)) {
      throw new Error(
        `Template engine '${type}' is not supported. Supported engines: ${this.SUPPORTED_ENGINES.join(', ')}`,
      );
    }

    const engine = this.engines.get(type);
    if (!engine) {
      throw new Error(
        `Template engine '${type}' is not registered. Make sure the template engine is properly configured.`,
      );
    }
    return engine;
  }

  getSupportedEngines(): string[] {
    return [...this.SUPPORTED_ENGINES];
  }

  isEngineSupported(type: string): boolean {
    return this.SUPPORTED_ENGINES.includes(type);
  }
}
