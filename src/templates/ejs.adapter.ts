import ejs from 'ejs';
import { TemplateAdapter } from '../interfaces/template-adapter.interface';

export class EjsAdapter implements TemplateAdapter {
  async compile(template: string, context: Record<string, any>): Promise<string> {
    return ejs.render(template, context);
  }
}
