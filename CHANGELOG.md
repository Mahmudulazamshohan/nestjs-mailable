# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-18

### Added
- Initial release of NestJS Mailer Core
- Laravel-inspired mail functionality for NestJS
- Multiple transport support (SMTP, Sendmail, SES, Mailgun, Postmark)
- Template engine support (Handlebars, Markdown, MJML)
- Queue system with retry logic and error handling
- Comprehensive testing utilities and mail faking
- Builder pattern for fluent email construction
- Factory pattern for transport creation
- Observer pattern for event handling
- Strategy pattern for different mail providers
- TypeScript support with strict typing
- Failover and round-robin transport strategies
- Responsive email support with MJML
- Comprehensive documentation and examples
- Full test coverage
- Development helpers (alwaysTo, fake mail)
- Custom decorator support for advanced features

### Features
- ✅ Multiple mail transports with automatic failover
- ✅ Template engines with Handlebars, Markdown, and MJML support
- ✅ Background processing with retry logic
- ✅ Comprehensive testing utilities
- ✅ Event system for mail lifecycle hooks
- ✅ TypeScript-first design with strict typing
- ✅ NestJS module integration with async configuration
- ✅ Custom transport and template engine support
- ✅ Development-friendly features for testing

### Documentation
- Complete README with usage examples
- API reference documentation
- Template examples for different engines
- Configuration guides for all transports
- Testing documentation and examples
- Design pattern explanations
