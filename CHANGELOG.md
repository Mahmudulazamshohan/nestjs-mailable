# [1.4.0](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.3.0...v1.4.0) (2025-08-31)


### Features

* update nestjs 11.1.6 support ([5b61346](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/5b61346f9ba2fb2a3d3062f5443788e61a7b73a6))

# [1.3.0](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.2.0...v1.3.0) (2025-08-24)


### Features

* add support for nestjs 11.0.1 ([ffe4437](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/ffe4437a68219e7bd743c0e3035f2baf10b4802f))

# [1.2.0](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.1.2...v1.2.0) (2025-08-23)


### Features

* add new transportation code ([3674a3b](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/3674a3bc99b739887454201845bb3cc8ed5efd3a))
* change templating system & add mailable. fix email sending issues [skip ci] ([da7f725](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/da7f725bd56923c7bd5b905fdba70bff3057ac55))

## [1.1.2](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.1.1...v1.1.2) (2025-08-17)


### Bug Fixes

* release docs ([d59073a](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/d59073a97e77d1829a5d4aaaf72d5a303492b9fa))

## [1.1.1](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.1.0...v1.1.1) (2025-08-17)


### Bug Fixes

* documentations ([6a7756d](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/6a7756d6c89de70f2ff3b1572f0cf3c4e9478fbf))

# [1.1.0](https://github.com/Mahmudulazamshohan/nestjs-mailable/compare/v1.0.0...v1.1.0) (2025-08-17)


### Features

* update readme ([66b1d3d](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/66b1d3d0181ed4086bdcf83be92fc349dbd5ce84))

# 1.0.0 (2025-08-17)


### Features

* release ([00d39c5](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/00d39c55fd8b5fd8393dfff22dbb9b9b6fb5484d))
* release 1.0.0 ([7f134df](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/7f134dfee093a2da2ccea87ed97d617951ad42bf))
* update github action & others ([5f7fdb0](https://github.com/Mahmudulazamshohan/nestjs-mailable/commit/5f7fdb0f17640b7d7d7987822ea8a3a3ba73b589))

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
