# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **nestjs-mailable**, a comprehensive NestJS mail package that provides Laravel-style mailable classes, fluent API for email composition, and multiple transport support (SMTP, SES, Mailgun). The package includes template engine support (Handlebars, EJS, Pug, MJML), attachment handling, and testing utilities.

**Current Version**: 1.1.2  
**Target Audience**: NestJS developers seeking production-ready email functionality  
**License**: MIT  
**Repository**: https://github.com/Mahmudulazamshohan/nestjs-mailable

## Development Commands

### Core Commands
- `yarn build` or `yarn run build:core` - Compile TypeScript to dist/
- `yarn dev` or `yarn run dev:core` - Watch mode TypeScript compilation
- `yarn test` or `yarn run test:core` - Run Jest tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Generate test coverage report
- `yarn lint` or `yarn run lint:core` - Run ESLint (max 99 warnings)
- `yarn lint:fix` or `yarn run lint:fix:core` - Auto-fix ESLint issues
- `yarn format` or `yarn run format:core` - Format code with Prettier
- `yarn typecheck` - TypeScript type checking without emission
- `yarn clean` - Remove dist and cache directories

### Documentation
- `yarn docs:start` - Start documentation development server (in docs/ dir)
- `yarn docs:build` - Build documentation site
- `yarn docs:serve` - Serve built documentation

### Publishing
- `yarn prepublishOnly` - Runs before npm publish (builds automatically)
- `yarn release` - Create semantic release

## Architecture Overview

### Core Structure
- **MailModule** (`src/mail.module.ts`) - Main NestJS module with forRoot/forRootAsync configuration
- **MailService** (`src/services/mail.service.ts`) - Primary service with fluent API and transport management
- **MailConfigService** (`src/services/mail-config.service.ts`) - Configuration management
- **MailTransportFactory** (`src/factories/mail-transport.factory.ts`) - Factory for creating transport instances

### Key Design Patterns
- **Factory Pattern** - MailTransportFactory creates transport instances based on configuration
- **Builder Pattern** - MailableBuilder for fluent email construction
- **Strategy Pattern** - Multiple template engines and transports

### Mailable Classes
Two types of mailable implementations:
1. **Legacy Mailables** (`src/mailables/mailable.ts`) - Simple build() method pattern
2. **Advanced Mailables** (`src/classes/mailable.ts`) - Laravel-style with envelope(), content(), attachments(), headers() methods

### Template System (Refactored in v1.1+)
- **Template Engine Factory** (`src/services/template.service.ts`) - Central factory for template engines
- **Modular Engines** (`src/engines/`) - Separate files for each template engine:
  - `src/engines/base.engine.ts` - Abstract base class with common functionality
  - `src/engines/handlebars.engine.ts` - Handlebars implementation  
  - `src/engines/ejs.engine.ts` - EJS implementation
  - `src/engines/pug.engine.ts` - Pug implementation
  - `src/engines/index.ts` - Centralized exports
- Templates directory configurable via module options

### Transport Layer
- **SMTP Transport** (`src/transports/smtp.transport.ts`) - Standard SMTP using nodemailer
- **SES Transport** (`src/transports/ses.transport.ts`) - AWS Simple Email Service
- **Mailgun Transport** (`src/transports/mailgun.transport.ts`) - Mailgun API integration

### Testing
- **MailFake** class in MailService for testing email sending without actual delivery
- Jest configuration in package.json targets `src/` with `.spec.ts` files
- Coverage reports generated to `coverage/` directory

## Configuration Notes

### TypeScript Config
- Target: ES2020, CommonJS modules
- Strict settings mostly disabled for flexibility
- Path aliases configured for `@/*` imports
- Declaration files generated for npm package
- Decorators and metadata emission enabled

### ESLint Config
- TypeScript ESLint parser with recommended rules
- Prettier integration for formatting
- Allows up to 99 warnings (configured in lint:core script)
- Jest environment enabled

### Package Management
- Uses Yarn as the primary package manager (`packageManager: "yarn@1.22.0"`)
- Includes docs/ subdirectory with separate package.json for Docusaurus
- Examples in examples/nestjs-email-app/ with working demonstrations

## Key Development Practices

### Module Configuration (v1.1+ Simplified Format)
The MailModule supports both sync (`forRoot`) and async (`forRootAsync`) configuration patterns. The configuration structure has been simplified for better developer experience with TypeScript type checking.

**SMTP Configuration:**
```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'localhost',
    port: 1025,
    ignoreTLS: true,
    secure: false,
    auth: {
      user: 'test',
      pass: 'test',
    },
  },
  from: {
    address: 'noreply@yourapp.com',
    name: 'Your App',
  },
  replyTo: {
    address: 'support@yourapp.com',
    name: 'Your App Support',
  },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    partials: {
      header: './partials/header',
      footer: './partials/footer',
    },
    options: {
      helpers: {
        currency: (amount: number) => `$${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString(),
      },
    },
  },
})
```

**SES Configuration:**
```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
  from: {
    address: 'noreply@yourapp.com',
    name: 'Your App',
  },
  templates: {
    engine: TEMPLATE_ENGINE.EJS,
    directory: './templates',
  },
})
```

**Mailgun Configuration:**
```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      apiKey: 'your-mailgun-api-key',
    },
  },
  from: {
    address: 'noreply@yourapp.com',
    name: 'Your App',
  },
  templates: {
    engine: TEMPLATE_ENGINE.PUG,
    directory: './templates',
    options: {
      pretty: false,
      compileDebug: false,
    },
  },
})
```

**Async Configuration with ConfigService:**
```typescript
MailModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService): Promise<MailConfiguration> => ({
    transport: {
      type: TransportType.SMTP,
      host: configService.get('MAIL_HOST', 'localhost'),
      port: configService.get('MAIL_PORT', 1025),
      ignoreTLS: configService.get('MAIL_IGNORE_TLS', true),
      secure: configService.get('MAIL_SECURE', false),
      auth: {
        user: configService.get('MAIL_USERNAME'),
        pass: configService.get('MAIL_PASSWORD'),
      },
    },
    from: {
      address: configService.get('MAIL_FROM_ADDRESS', 'noreply@yourapp.com'),
      name: configService.get('MAIL_FROM_NAME', 'Your App'),
    },
    templates: {
      engine: configService.get('TEMPLATE_ENGINE', TEMPLATE_ENGINE.HANDLEBARS) as any,
      directory: path.join(__dirname, '../email/templates'),
    },
  }),
  inject: [ConfigService],
})
```

### Fluent API Implementation (v1.1+)
Major API improvements for cleaner, more intuitive usage:
- **Direct Method Chaining**: `MailService.to()` returns `MailSender` directly (not Promise) for seamless chaining
- **Auto Template Engine Detection**: Template engine is detected from module configuration - no more `withEngine()`
- **Auto Extension Resolution**: Template files auto-resolve extensions (`.hbs`, `.ejs`, `.pug`) based on configured engine
- **Clean Syntax**: `mailService.to(email).cc(cc).bcc(bcc).send(mailable)` - just like Laravel

### Configuration System Improvements (v1.1+)
- **Simplified Structure**: Direct `transport`, `from`, `replyTo`, `templates` at top level
- **TypeScript Type Safety**: Transport-specific options with proper type checking
- **Template Engine Constants**: `TEMPLATE_ENGINE.HANDLEBARS` instead of strings
- **Enhanced Template Support**: Built-in partials and helpers configuration
- **forRootAsync Support**: Full async configuration with dependency injection
- **Backward Compatibility**: Legacy configuration format still supported

### Attachment Handling
The AttachmentBuilder class (in advanced mailables) provides fluent attachment creation from file paths, storage, or in-memory data with MIME type specification.

### Template Resolution (v1.1+ Enhanced)
Template engines are initialized based on configuration and registered with the TemplateEngineFactory. Templates are resolved relative to the configured directory path.

**Template Engine Constants:**
```typescript
import { TEMPLATE_ENGINE } from 'nestjs-mailable';

// Available engines
TEMPLATE_ENGINE.HANDLEBARS  // 'handlebars'
TEMPLATE_ENGINE.EJS         // 'ejs' 
TEMPLATE_ENGINE.PUG         // 'pug'
TEMPLATE_ENGINE.MJML        // 'mjml'
```

**Enhanced Template Configuration:**
```typescript
templates: {
  engine: TEMPLATE_ENGINE.HANDLEBARS,
  directory: './email/templates',
  partials: {
    header: './partials/header',
    footer: './partials/footer',
    sidebar: './partials/sidebar'
  },
  options: {
    helpers: {
      currency: (amount: number) => `$${amount.toFixed(2)}`,
      formatDate: (date: Date) => date.toLocaleDateString(),
      uppercase: (str: string) => str.toUpperCase()
    }
  }
}
```

**Template Engine Features:**
- **Handlebars**: Supports partials and custom helpers
- **EJS**: Supports includes and custom options
- **Pug**: Supports extends/blocks and compile options
- **MJML**: Responsive email template compilation (if available)

## API Usage Patterns

### Basic Email Sending
```typescript
// Simple email
await mailService.to('recipient@example.com')
  .subject('Hello World')
  .html('<h1>Hello!</h1>')
  .send();

// With template
await mailService.to('user@example.com')
  .subject('Welcome')
  .template('welcome', { name: 'John' })
  .send();
```

### Using Mailable Classes (Laravel-style)
```typescript
// Advanced Mailable
export class WelcomeMail extends Mailable {
  constructor(private user: User) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Welcome ${this.user.name}!`,
      tags: ['welcome', 'onboarding'],
      metadata: { userId: this.user.id }
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/welcome',
      with: { user: this.user }
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./welcome.pdf').as('guide.pdf').build()
    ];
  }
}

// Usage
await mailService.to('user@example.com').send(new WelcomeMail(user));
```

### Transport Configuration (v1.1+ Format)
The new configuration format focuses on single transport configuration with type safety:

```typescript
// SMTP Transport
import { TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: 'user@gmail.com', pass: 'password' }
  },
  from: { address: 'noreply@app.com', name: 'My App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates'
  }
})

// SES Transport  
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  from: { address: 'noreply@app.com', name: 'My App' }
})

// Mailgun Transport
MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.app.com',
      apiKey: process.env.MAILGUN_API_KEY
    }
  },
  from: { address: 'noreply@app.com', name: 'My App' }
})
```

## NPM Package Development Guidelines

### Pre-commit Checks
- ESLint must pass with max 99 warnings
- TypeScript compilation must succeed
- All tests must pass
- Prettier formatting applied

### Publishing Process
1. **Development**: Make changes, ensure tests pass
2. **Build**: `yarn build` - generates dist/ directory
3. **Version**: Uses semantic-release for automatic versioning
4. **Publish**: `yarn release` - creates release and publishes to npm

### Package Structure for Distribution
```
nestjs-mailable/
├── dist/                 # Compiled JavaScript + declarations
├── src/                  # TypeScript source (included in package)
├── docs/                 # Documentation site
├── examples/             # Working examples
├── templates/            # Sample templates
├── package.json          # Main package configuration
└── README.md             # User documentation
```

### Dependencies Strategy
- **peerDependencies**: NestJS core packages (prevents version conflicts)
- **dependencies**: Template engines, transport libraries (direct includes)
- **devDependencies**: Build tools, testing, linting

## Common Development Tasks

### Adding New Template Engine (v1.1+ Modular Structure)
1. Create new engine in `src/engines/[engine-name].engine.ts`
2. Extend `BaseTemplateEngine` abstract class from `src/engines/base.engine.ts`
3. Implement `render()` and `compile()` methods
4. Add engine constant to `src/constants/template.constants.ts`
5. Export from `src/engines/index.ts`
6. Update `TemplateEngineFactory` in `src/services/template.service.ts`
7. Add configuration interface to `mail.interface.ts` if needed
8. Add tests in `src/__tests__/`

**Example Engine Implementation:**
```typescript
// src/engines/my-engine.engine.ts
import { BaseTemplateEngine } from './base.engine';
import { TemplateConfiguration } from '../interfaces/mail.interface';

export class MyTemplateEngine extends BaseTemplateEngine {
  constructor(templateDir: string, mainFile: string, config?: TemplateConfiguration) {
    super(templateDir, mainFile, 'my-ext');
    if (config) {
      this.configureEngine(config);
    }
  }

  async render(template: string, context: Record<string, unknown>): Promise<string> {
    const templateContent = await this.loadTemplate(template);
    // Implement engine-specific rendering logic
    return renderedContent;
  }

  async compile(source: string): Promise<(context: Record<string, unknown>) => string> {
    // Implement compilation logic
    return (context) => compiledTemplate(context);
  }

  private configureEngine(config: TemplateConfiguration): void {
    // Configure engine with options, helpers, etc.
  }
}
```

### Adding New Transport
1. Create transport in `src/transports/[transport-name].transport.ts`
2. Implement `MailTransport` interface
3. Add to `MailTransportFactory.createTransport()` switch in `src/factories/mail-transport.factory.ts`
4. Update `TransportType` enum in `src/types/transport.type.ts`
5. Export from `src/transports/index.ts`
6. Add configuration interface to `mail.interface.ts` in `TransportConfiguration`
7. Add tests in `src/__tests__/`

**Example Transport Implementation:**
```typescript
// src/transports/my-transport.transport.ts
import { MailTransport } from '../interfaces/mail.interface';
import { Content } from '../interfaces/mail.interface';

export class MyTransport implements MailTransport {
  constructor(private config: MyTransportConfig) {}

  async send(content: Content): Promise<unknown> {
    // Implement transport-specific sending logic
    return result;
  }

  async verify(): Promise<boolean> {
    // Implement connection verification
    return true;
  }

  async close(): Promise<void> {
    // Cleanup connections if needed
  }
}

// Add to src/types/transport.type.ts
export enum TransportType {
  SMTP = 'smtp',
  SES = 'ses',
  MAILGUN = 'mailgun',
  MY_TRANSPORT = 'my-transport', // Add new transport
}
```

### Writing Tests
- Use Jest with TypeScript
- Mock external dependencies (nodemailer, aws-sdk, etc.)
- Test both success and error scenarios
- Include integration tests for full workflow
- Maintain high coverage (aim for >80%)

## Error Handling Patterns

### Template Engine Errors
```typescript
// Graceful degradation when template engine not installed
try {
  const engine = new HandlebarsTemplateEngine('./templates', 'main.hbs');
} catch (error) {
  throw new Error('Handlebars template engine is not available. Please install it with: npm install handlebars');
}
```

### Transport Errors
```typescript
// Configuration validation
if (config.transport === 'ses' && !config.options) {
  throw new Error('SES transport requires options configuration');
}
```

### Template Loading Errors
```typescript
// File system errors with helpful context
catch (error) {
  throw new Error(`Failed to load template file '${template}': ${error.message}`);
}
```

## Performance Considerations

### Template Caching
- Handlebars templates are compiled and cached in memory
- EJS templates are rendered fresh each time (lightweight)
- Pug templates are compiled on each render but optimized

### Transport Connection Pooling
- SMTP transport uses nodemailer connection pooling
- SES uses AWS SDK connection management
- Mailgun uses HTTP client with keep-alive

## Security Best Practices

### Input Validation
- All email addresses validated before sending
- Template context sanitized to prevent XSS
- Attachment paths validated to prevent directory traversal

### Credential Management
- Support for environment variables
- No hardcoded credentials in source
- Secure configuration injection patterns

## Examples and Integration

Working examples available in `examples/nestjs-email-app/`:
- Basic NestJS integration
- Multiple transport configurations  
- Template engine usage
- Mailable class implementations
- Testing patterns

## Troubleshooting Common Issues

### Template Engine Not Found
- Ensure template engine packages are installed: `npm install handlebars ejs pug`
- Check module configuration matches installed engines

### Transport Configuration Errors
- Verify SMTP credentials and server settings
- For SES: ensure AWS credentials and region are correct
- For Mailgun: verify API key and domain settings

### Build Issues
- Run `yarn clean` to clear cache
- Ensure TypeScript version compatibility
- Check for conflicting peer dependencies

## Contributing Guidelines

When working with this codebase:
1. Follow existing code patterns and naming conventions
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility when possible
5. Use semantic commit messages for release automation

## important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.