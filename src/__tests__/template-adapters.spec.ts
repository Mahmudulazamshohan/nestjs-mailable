import { EjsAdapter } from '../templates/ejs.adapter';
import { HandlebarsAdapter } from '../templates/handlebars.adapter';
import { PugAdapter } from '../templates/pug.adapter';

describe('Template Adapters', () => {
  describe('EjsAdapter', () => {
    it('should be defined', () => {
      expect(EjsAdapter).toBeDefined();
    });

    it('should create instance', () => {
      const adapter = new EjsAdapter();
      expect(adapter).toBeDefined();
    });
  });

  describe('HandlebarsAdapter', () => {
    it('should be defined', () => {
      expect(HandlebarsAdapter).toBeDefined();
    });

    it('should create instance', () => {
      const adapter = new HandlebarsAdapter();
      expect(adapter).toBeDefined();
    });
  });

  describe('PugAdapter', () => {
    it('should be defined', () => {
      expect(PugAdapter).toBeDefined();
    });

    it('should create instance', () => {
      const adapter = new PugAdapter();
      expect(adapter).toBeDefined();
    });
  });
});
