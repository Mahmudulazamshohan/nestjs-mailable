# Contributing to NestJS Mailable

Thank you for your interest in contributing to NestJS Mailable! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- Yarn (recommended) or npm
- Git
- TypeScript knowledge
- Basic understanding of NestJS framework

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/nestjs-mailable.git
   cd nestjs-mailable
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up development environment**
   ```bash
   # Install optional dependencies for full development
   yarn add -D handlebars ejs pug aws-sdk mailgun.js nodemailer
   ```

4. **Run tests to verify setup**
   ```bash
   yarn test
   ```

5. **Start development build**
   ```bash
   yarn dev
   ```

## Project Structure

```
nestjs-mailable/
├── src/                          # Source code
│   ├── classes/                  # Mailable classes
│   ├── engines/                  # Template engines
│   ├── factories/                # Factory classes
│   ├── interfaces/               # TypeScript interfaces
│   ├── services/                 # Core services
│   ├── transports/              # Email transports
│   ├── types/                   # Type definitions
│   └── __tests__/               # Unit tests
├── docs/                        # Documentation site
├── examples/                    # Example applications
├── dist/                        # Compiled output
└── templates/                   # Sample templates
```

### Key Components

- **MailModule**: Main NestJS module
- **MailService**: Primary service with fluent API
- **Mailable**: Advanced mailable classes
- **Transport Layer**: SMTP, SES, Mailgun support
- **Template Engines**: Handlebars, EJS, Pug support

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-template-engine-support`
- `fix/mailgun-attachment-handling`
- `docs/update-getting-started-guide`
- `refactor/simplify-transport-factory`

### Development Commands

```bash
# Development
yarn dev                    # Watch mode compilation
yarn build                  # Production build
yarn typecheck             # TypeScript type checking

# Testing
yarn test                   # Run all tests
yarn test:watch            # Run tests in watch mode
yarn test:coverage         # Generate coverage report

# Code Quality
yarn lint                  # Run ESLint
yarn lint:fix              # Fix ESLint issues
yarn format                # Format code with Prettier

# Documentation
yarn docs:start            # Start documentation server
yarn docs:build            # Build documentation site

# Cleanup
yarn clean                 # Remove build artifacts
```

## Testing

### Test Structure

Tests are located in `src/__tests__/` and should follow the naming convention:
- `*.spec.ts` for unit tests
- `*.integration.spec.ts` for integration tests

### Writing Tests

1. **Unit Tests**: Test individual components in isolation
   ```typescript
   describe('MailService', () => {
     let mailService: MailService;
     
     beforeEach(async () => {
       const module = await Test.createTestingModule({
         providers: [MailService, /* mocked dependencies */],
       }).compile();
       
       mailService = module.get<MailService>(MailService);
     });
     
     it('should send email with template', async () => {
       // Test implementation
     });
   });
   ```

2. **Integration Tests**: Test complete workflows
   ```typescript
   describe('Email Integration', () => {
     it('should send email through SMTP transport', async () => {
       // Full integration test
     });
   });
   ```

### Test Requirements

- All new features must include tests
- Aim for >80% test coverage
- Mock external dependencies (nodemailer, AWS SDK, etc.)
- Test both success and error scenarios

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test mail.service.spec.ts

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode during development
yarn test:watch
```

## Code Style

### TypeScript Guidelines

- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type unless absolutely necessary

### ESLint Configuration

The project uses ESLint with TypeScript support:
- Max 99 warnings allowed
- Prettier integration for formatting
- Jest environment enabled

### Naming Conventions

- **Classes**: PascalCase (`MailService`, `HandlebarsEngine`)
- **Methods**: camelCase (`sendEmail`, `renderTemplate`)
- **Constants**: UPPER_SNAKE_CASE (`TEMPLATE_ENGINE`)
- **Files**: kebab-case (`mail.service.ts`, `handlebars.engine.ts`)

### Code Organization

- One class per file
- Export from index files
- Use dependency injection
- Follow SOLID principles

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following project conventions
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   yarn test
   yarn lint
   yarn typecheck
   yarn build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new template engine support"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions
   - `refactor:` for code refactoring
   - `chore:` for maintenance tasks

5. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated (if applicable)
- [ ] Breaking changes are documented
- [ ] Changelog entry added (for significant changes)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Reporting Issues

### Bug Reports

Use the GitHub issue template and include:

1. **Environment details**
   - NestJS Mailable version
   - Node.js version
   - Operating system
   - Transport type (SMTP, SES, Mailgun)

2. **Steps to reproduce**
   ```typescript
   // Minimal code example
   ```

3. **Expected vs actual behavior**

4. **Error messages/stack traces**

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation needs
- `good first issue`: Good for newcomers
- `help wanted`: Community help needed

## Feature Requests

### Before Requesting

1. Check existing issues and discussions
2. Consider if it fits the project scope
3. Think about backward compatibility
4. Consider implementation complexity

### Feature Request Format

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches were considered?
```

## Adding New Components

### Template Engine

1. Create engine in `src/engines/[name].engine.ts`
2. Extend `BaseTemplateEngine`
3. Implement required methods
4. Add to `TemplateEngineFactory`
5. Update constants and types
6. Add comprehensive tests

### Transport

1. Create transport in `src/transports/[name].transport.ts`
2. Implement `MailTransport` interface
3. Add to `MailTransportFactory`
4. Update transport types
5. Add configuration interface
6. Add tests and examples

### Example Implementation

```typescript
// src/transports/new-transport.transport.ts
import { MailTransport } from '../interfaces/mail.interface';

export class NewTransport implements MailTransport {
  constructor(private config: NewTransportConfig) {}
  
  async send(content: Content): Promise<unknown> {
    // Implementation
  }
  
  async verify(): Promise<boolean> {
    // Verification logic
  }
}
```

## Documentation

### Documentation Updates

- Update README.md for significant changes
- Add examples for new features
- Update API documentation
- Consider adding to docs site

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide complete configuration examples
- Document breaking changes

## Community

### Getting Help

- GitHub Issues for bug reports and features
- GitHub Discussions for questions
- Check existing documentation first

### Contributing to Community

- Help answer questions in issues
- Improve documentation
- Review pull requests
- Share usage examples

## Release Process

### Versioning

The project uses semantic versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Notes

Significant changes should include:
- Feature descriptions
- Breaking change migrations
- Bug fix details
- Contributors acknowledgment

## Recognition

Contributors will be:
- Listed in package.json contributors
- Mentioned in release notes
- Added to project documentation

Thank you for contributing to NestJS Mailable! Your efforts help make email handling in NestJS applications better for everyone.