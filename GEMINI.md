# Project Overview

This project is a `nestjs-mailable` library for NestJS. It provides advanced mailable classes for NestJS with a fluent API, multiple transports, and comprehensive template support.

**Main Technologies:**

*   TypeScript
*   NestJS
*   Node.js

**Architecture:**

The library is built around the `MailModule`, which can be configured using the `forRoot` or `forRootAsync` methods. The `MailService` provides a fluent API for building and sending emails. The library supports multiple email transports (SMTP, Amazon SES, and Mailgun) and template engines (Handlebars, EJS, and Pug).

# Building and Running

**Build the project:**

```bash
npm run build
```

**Run the tests:**

```bash
npm run test
```

**Run the linter:**

```bash
npm run lint
```

# Development Conventions

*   **Coding Style:** The project uses Prettier for code formatting and ESLint for linting.
*   **Testing:** The project uses Jest for testing.
*   **Contribution:** The project has a `CONTRIBUTING.md` file with guidelines for contributing to the project.

# Transports

The library supports the following email transports:

*   **SMTP:** For sending emails through an SMTP server.
*   **Amazon SES:** for sending emails through Amazon SES.
*   **Mailgun:** for sending emails through the Mailgun API.

Each transport has its own configuration options. Please refer to the `README.md` file for more details on how to configure each transport.

# Template Engines

The library supports the following template engines:

*   **Handlebars:** A popular template engine with a simple syntax.
*   **EJS:** A simple templating language that lets you generate HTML markup with plain JavaScript.
*   **Pug:** A high-performance template engine heavily influenced by Haml.

You can specify the template engine to use in the `MailModule` configuration. The `README.md` file provides examples of how to use each template engine.

# Examples

The `examples` directory contains example projects that demonstrate how to use the library. To run the examples, you will need to install the dependencies for each example project and configure the environment variables.

# Advanced Usage

The library provides advanced features like mailable classes, which allow you to create reusable email components. The `README.md` file provides a detailed explanation of how to use mailable classes.