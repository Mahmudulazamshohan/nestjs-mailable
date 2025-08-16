import { Injectable } from '@nestjs/common';
import { TemplateEngine } from '../interfaces/mail.interface';
import * as Handlebars from 'handlebars';
import { marked } from 'marked';
import * as mjml from 'mjml';
import * as path from 'path';
import { promises as fs } from 'fs';

// Template Engine Strategy Pattern
@Injectable()
export class HandlebarsTemplateEngine implements TemplateEngine {
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>();
  constructor(
    private templateDir: string,
    private mainFile: string,
  ) {}

  async render(template: string, context: Record<string, any>): Promise<string> {
    let compiledTemplate = this.compiledTemplates.get(template);
    if (!compiledTemplate) {
      const templateSource = await this.loadTemplate(template);
      compiledTemplate = Handlebars.compile(templateSource);
      this.compiledTemplates.set(template, compiledTemplate);
    }
    return compiledTemplate(context);
  }

  async compile(source: string): Promise<(context: Record<string, any>) => string> {
    const compiledTemplate = Handlebars.compile(source);
    return (context: Record<string, any>) => compiledTemplate(context);
  }

  registerHelper(name: string, helper: (...args: any[]) => any): void {
    Handlebars.registerHelper(name, helper);
  }

  registerPartial(name: string, partial: string): void {
    Handlebars.registerPartial(name, partial);
  }

  private async loadTemplate(template: string): Promise<string> {
    // Load template from file system using provided directory and file name
    const filePath = path.join(this.templateDir, template || this.mainFile);
    return await fs.readFile(filePath, 'utf8');
  }
}

@Injectable()
export class MarkdownTemplateEngine implements TemplateEngine {
  private handlebarsEngine: HandlebarsTemplateEngine;
  constructor(templateDir: string, mainFile: string) {
    this.handlebarsEngine = new HandlebarsTemplateEngine(templateDir, mainFile);
  }

  async render(template: string, context: Record<string, any>): Promise<string> {
    if (template === 'markdown' && context.markdown) {
      context.markdownContent = marked(context.markdown);
    }
    return this.handlebarsEngine.render(template, context);
  }

  async compile(source: string): Promise<(context: Record<string, any>) => string> {
    return this.handlebarsEngine.compile(source);
  }
}

@Injectable()
export class MjmlTemplateEngine implements TemplateEngine {
  constructor(
    private templateDir: string,
    private mainFile: string,
  ) {}

  async render(template: string, context: Record<string, any>): Promise<string> {
    const mjmlTemplate = await this.loadTemplate(template);
    const compiledTemplate = Handlebars.compile(mjmlTemplate);
    const mjmlContent = compiledTemplate(context);
    const { html } = mjml(mjmlContent);
    return html;
  }

  async compile(source: string): Promise<(context: Record<string, any>) => string> {
    return (context: Record<string, any>) => {
      const compiledTemplate = Handlebars.compile(source);
      const mjmlContent = compiledTemplate(context);
      const { html } = mjml(mjmlContent);
      return html;
    };
  }

  private async loadTemplate(template: string): Promise<string> {
    const filePath = path.join(this.templateDir, template || this.mainFile);
    return await fs.readFile(filePath, 'utf8');
  }
}

// Template Engine Factory
@Injectable()
export class TemplateEngineFactory {
  private engines = new Map<string, TemplateEngine>();

  registerEngine(type: string, engine: TemplateEngine): void {
    this.engines.set(type, engine);
  }

  getEngine(type: string): TemplateEngine {
    const engine = this.engines.get(type);
    if (!engine) {
      throw new Error(`Template engine '${type}' not found`);
    }
    return engine;
  }
}
