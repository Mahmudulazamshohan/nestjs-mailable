import { MailableBuilder, Mailable, MailModule } from '../index';

describe('Index Exports', () => {
  it('should export MailableBuilder', () => {
    expect(MailableBuilder).toBeDefined();
  });

  it('should export Mailable', () => {
    expect(Mailable).toBeDefined();
  });

  it('should export MailModule', () => {
    expect(MailModule).toBeDefined();
  });

  it('should have all main classes accessible via named exports', () => {
    expect(typeof MailableBuilder).toBe('function');
    expect(typeof Mailable).toBe('function');
    expect(typeof MailModule).toBe('function');
  });

  it('should export main required classes', async () => {
    const exports = await import('../index');
    const exportedKeys = Object.keys(exports);

    // Ensure the main classes are exported
    expect(exportedKeys).toContain('MailableBuilder');
    expect(exportedKeys).toContain('Mailable');
    expect(exportedKeys).toContain('MailModule');

    // Should have all public exports
    expect(exportedKeys.length).toBeGreaterThan(3);
  });
});
