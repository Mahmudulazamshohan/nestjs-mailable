import * as engines from '../engines';

describe('engines/index exports', () => {
  it('re-exports all template engine symbols', () => {
    expect(engines.BaseTemplateEngine).toBeDefined();
    expect(engines.ensurePackageAvailable).toBeDefined();
    expect(engines.HandlebarsTemplateEngine).toBeDefined();
    expect(engines.EjsTemplateEngine).toBeDefined();
    expect(engines.PugTemplateEngine).toBeDefined();
  });
});
