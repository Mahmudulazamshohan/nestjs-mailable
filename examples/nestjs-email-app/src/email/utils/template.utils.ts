export function getTemplateExtension(engine?: string): string {
  const templateEngine = engine || process.env.MAIL_TEMPLATE_ENGINE || 'handlebars';

  switch (templateEngine.toLowerCase()) {
    case 'ejs':
      return 'ejs';
    case 'pug':
      return 'pug';
    case 'handlebars':
    default:
      return 'hbs';
  }
}

export function getTemplateName(baseName: string, engine?: string): string {
  const extension = getTemplateExtension(engine);
  return `${baseName}.${extension}`;
}
