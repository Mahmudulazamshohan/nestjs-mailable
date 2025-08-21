export const TEMPLATE_ENGINE = {
  HANDLEBARS: 'handlebars',
  EJS: 'ejs',
  PUG: 'pug',
  MJML: 'mjml',
} as const;

export type TemplateEngineType = (typeof TEMPLATE_ENGINE)[keyof typeof TEMPLATE_ENGINE];
