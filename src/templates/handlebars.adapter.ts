import Handlebars from 'handlebars';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';

export class HandlebarsAdapter implements TemplateAdapter {
  async compile(template: string, context: Record<string, any>): Promise<string> {
    const compiled = Handlebars.compile(template);
    return compiled(context);
  }
}
