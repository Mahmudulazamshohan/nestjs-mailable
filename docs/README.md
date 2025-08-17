# NestJS Mailable Core Documentation

This directory contains the comprehensive documentation for NestJS Mailable Core, built with [Docusaurus](https://docusaurus.io/).

## 📚 Documentation Structure

### Core Documentation
- **[Introduction](./docs/intro.md)** - Getting started, features overview, and quick start guide
- **[Configuration](./docs/configuration.md)** - Module setup, transport providers, environment variables
- **[Mailable Classes](./docs/mailables.md)** - Creating reusable email templates with object-oriented patterns
- **[Testing](./docs/testing.md)** - MailFake utilities, unit testing, integration testing
- **[Templates](./docs/templates.md)** - Handlebars, EJS, Pug, MJML, and Markdown template engines
- **[Advanced Features](./docs/advanced.md)** - Queues, monitoring, performance optimization, security
- **[API Reference](./docs/api-reference.md)** - Complete API documentation for all classes and interfaces

### Features Covered

#### 🚀 Core Features
- ✅ Multiple transport support (SMTP, SES, Mailgun)
- ✅ Mailable classes with fluent API
- ✅ Template engine integration
- ✅ Queue-based email processing
- ✅ Comprehensive testing utilities
- ✅ Error handling and monitoring

## 🛠️ Development

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn

### Running the Documentation Site

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```
   This command starts a local development server and opens up a browser window at `http://localhost:3000`.

3. **Build for production:**
   ```bash
   npm run build
   ```
   This command generates static content into the `build` directory.

4. **Serve production build:**
   ```bash
   npm run serve
   ```

## 🚢 Deployment

### GitHub Pages Deployment

Using SSH:
```bash
USE_SSH=true npm run deploy
```

Not using SSH:
```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command builds the website and pushes to the `gh-pages` branch.

## 📝 Contributing to Documentation

### Adding New Documentation

1. Create a new markdown file in the `docs/` directory
2. Add frontmatter with sidebar position
3. Update `sidebars.ts` to include your new page
4. Test locally with `npm start`

### Documentation Standards

- **Clear and concise** - Explain concepts simply
- **Example-driven** - Include code examples for all features
- **TypeScript-first** - All examples use TypeScript
- **Tested code** - Ensure all examples actually work

This creates comprehensive documentation covering all aspects of the NestJS Mailer Core package with practical examples, best practices, and complete API reference.
