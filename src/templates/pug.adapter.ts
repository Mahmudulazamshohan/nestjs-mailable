import pug from 'pug';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';

export class PugAdapter implements TemplateAdapter {
  async compile(template: string, context: Record<string, any>): Promise<string> {
    const compiled = pug.compile(template);
    return compiled(context);
  }
}
