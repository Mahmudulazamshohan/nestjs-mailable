import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';
import { OrderShippedAdvanced, Order } from './mails/order-shipped-advanced.mailable';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('order-shipped-advanced')
  async sendOrderShippedAdvanced(@Body() body: { email: string; mailer?: 'smtp' | 'ses' }) {
    return this.emailService.sendOrderShippedAdvanced(body.email, body.mailer);
  }

  @Get('test-mailer/:mailer')
  async testMailer(@Param('mailer') mailer: 'smtp' | 'ses') {
    if (!['smtp', 'ses'].includes(mailer)) {
      return {
        success: false,
        error: 'Invalid mailer. Must be: smtp or ses',
      };
    }
    return this.emailService.sendTestEmail(mailer);
  }

  @Get('test-template')
  async testTemplate() {
    try {
      // This is a simplified test to check if template configuration works
      return {
        success: true,
        message: 'Template configuration is correct',
        engine: process.env.MAIL_TEMPLATE_ENGINE || 'handlebars',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  @Post('test-helpers')
  async testHelpers(@Body() body: { email: string }) {
    try {
      // Test data with various scenarios
      const testData = {
        customerEmail: body.email,
        orderId: 'ORD-2024-001',
        orderName: 'Premium JavaScript Course',
        orderPrice: 149.99,
        invoiceNumber: 'INV-2024-001',
        createdAt: new Date(),
        items: [
          { name: 'Course Access', price: 99.99 },
          { name: 'Certificate', price: 49.99 },
        ],
        total: 149.99,
        discount: 10.0,
        userName: 'john doe',
        description: 'this is a test description for helper functions',
      };

      const result = await this.emailService.testTemplateHelpers(body.email, testData);

      return {
        success: true,
        message: 'Template helper functions tested successfully',
        result,
        testData,
        etherealInfo: {
          url: 'https://ethereal.email/',
          username: process.env.MAIL_USERNAME,
          password: process.env.MAIL_PASSWORD,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Post('send-all-templates')
  async sendAllTemplates(@Body() body: { email: string }) {
    const results: any[] = [];
    const templateEngines = ['handlebars', 'ejs', 'pug'];

    for (const engine of templateEngines) {
      try {
        // Set environment variable for current template engine
        process.env.MAIL_TEMPLATE_ENGINE = engine;

        // Send Welcome Email (only available in handlebars)
        if (engine === 'handlebars') {
          const welcomeResult = await this.emailService.sendWelcomeEmail(
            body.email,
            'Test User',
            'https://example.com/welcome',
            ['Advanced Templates', 'Multiple Transports', 'Attachment Support'],
          );

          results.push({
            engine,
            template: 'welcome.hbs',
            type: 'welcome',
            result: welcomeResult,
            status: 'success',
          });
        }

        // Send Order Shipped Email (available in all engines)
        const orderData: Order = {
          id: Math.floor(Math.random() * 10000) + 1000,
          name: 'Premium Package',
          price: 99.99,
          invoice_number: `INV-${engine.toUpperCase()}-${Date.now()}`,
          customer_email: body.email,
        };

        const orderMailable = new OrderShippedAdvanced(orderData);
        const orderResult = await this.emailService.sendMailable(body.email, orderMailable);

        results.push({
          engine,
          template: `shipped.${engine === 'handlebars' ? 'hbs' : engine}`,
          type: 'order-shipped',
          result: orderResult,
          status: 'success',
        });

        // Send Template Helpers Test (handlebars only)
        if (engine === 'handlebars') {
          const testData = {
            customerEmail: body.email,
            orderId: 'ORD-HELPERS-001',
            orderName: 'Helper Test Order',
            orderPrice: 75.5,
            invoiceNumber: 'INV-HELPERS-001',
            createdAt: new Date(),
            items: [
              { name: 'Test Item 1', price: 50.0 },
              { name: 'Test Item 2', price: 25.5 },
            ],
            total: 75.5,
            discount: 5.0,
            userName: 'helper tester',
            description: 'testing all helper functions in templates',
          };

          const helpersResult = await this.emailService.testTemplateHelpers(body.email, testData);

          results.push({
            engine,
            template: 'test-helpers.hbs',
            type: 'template-helpers',
            result: helpersResult,
            status: 'success',
          });
        }

        // Wait between engines to avoid overwhelming
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          engine,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: true,
      message: 'Sent all available templates using all template engines',
      totalSent: results.filter((r) => r.status === 'success').length,
      results,
      templatesSent: results.filter((r) => r.status === 'success').map((r) => `${r.template} (${r.type})`),
      etherealInfo: {
        url: 'https://ethereal.email/',
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD,
        message: 'Login to Ethereal Email to view sent emails',
      },
    };
  }

  @Post('test-all-engines')
  async testAllEngines(@Body() body: { email: string }) {
    const templateEngines = ['handlebars', 'ejs', 'pug'];
    const results: any[] = [];

    for (const engine of templateEngines) {
      try {
        // Set environment variable for current template engine
        process.env.MAIL_TEMPLATE_ENGINE = engine;

        // Test Welcome Email
        const welcomeResult = await this.emailService.sendWelcomeEmail(
          body.email,
          'Test User',
          'https://example.com/welcome',
          ['Advanced Templates', 'Multiple Transports', 'Attachment Support'],
        );

        // Test Order Shipped Email
        const orderData: Order = {
          id: Math.floor(Math.random() * 10000) + 1000,
          name: 'Premium Package',
          price: 99.99,
          invoice_number: `INV-${engine.toUpperCase()}-${Date.now()}`,
          customer_email: body.email,
        };

        const orderMailable = new OrderShippedAdvanced(orderData);
        const orderResult = await this.emailService.sendMailable(body.email, orderMailable);

        results.push({
          engine,
          welcomeEmail: welcomeResult,
          orderEmail: orderResult,
          status: 'success',
        });

        // Wait between engines
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          engine,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: true,
      message: 'Tested all template engines with attachments1.pdf',
      results,
      etherealInfo: {
        url: 'https://ethereal.email/',
        username: process.env.MAIL_USERNAME,
        password: process.env.MAIL_PASSWORD,
      },
    };
  }

  @Post('welcome')
  async sendWelcome(@Body() body: { email: string; name: string; actionUrl?: string; features?: string[] }) {
    return this.emailService.sendWelcomeEmail(
      body.email,
      body.name,
      body.actionUrl || 'https://example.com/welcome',
      body.features || ['Advanced Templates', 'Multiple Transports', 'Attachment Support'],
    );
  }

  @Get('info')
  async getInfo() {
    return {
      title: 'NestJS Mailable - Advanced Example',
      currentEngine: process.env.MAIL_TEMPLATE_ENGINE || 'handlebars',
      defaultMailer: process.env.MAILER_DEFAULT || 'smtp',
      supportedEngines: ['handlebars', 'ejs', 'pug'],
      supportedMailers: ['smtp', 'ses'],
      availableTemplates: {
        'mail/orders/shipped': {
          handlebars: 'Gradient header design with modern styling',
          ejs: 'Colorful design with card layout and features grid',
          pug: 'Premium design with steps visualization and badges',
        },
      },
      advancedFeatures: [
        'envelope() method - Define subject, tags, metadata, and custom callbacks',
        'content() method - Specify template and data binding',
        'attachments() method - Use AttachmentBuilder for flexible file handling',
        'headers() method - Set Message-ID, references, and custom headers',
        'Simplified fluent API - Chain to(), cc(), bcc() methods directly',
        'Template engine auto-detection from configuration',
        'No more withEngine() - cleaner API',
      ],
      endpoints: {
        sendAllTemplates: {
          method: 'POST',
          path: '/email/send-all-templates',
          body: { email: 'string' },
          description: 'Send ALL available templates using ALL template engines (5 emails total)',
        },
        testAllEngines: {
          method: 'POST',
          path: '/email/test-all-engines',
          body: { email: 'string' },
          description: 'Send emails with all template engines (handlebars, ejs, pug) with attachments1.pdf',
        },
        sendWelcome: {
          method: 'POST',
          path: '/email/welcome',
          body: { email: 'string', name: 'string', actionUrl: 'string (optional)', features: 'string[] (optional)' },
          description: 'Send welcome email with attachments1.pdf',
        },
        sendSingle: {
          method: 'POST',
          path: '/email/order-shipped-advanced',
          body: { email: 'string', mailer: 'smtp|ses (optional)' },
          description: 'Send order shipped email using configured template engine',
        },
        testMailer: {
          method: 'GET',
          path: '/email/test-mailer/{mailer}',
          parameters: 'mailer: smtp|ses',
          description: 'Send a test email using the specified mailer',
          examples: ['GET /email/test-mailer/smtp', 'GET /email/test-mailer/ses'],
        },
        testTemplate: {
          method: 'GET',
          path: '/email/test-template',
          description: 'Test if template configuration is correct',
        },
        info: {
          method: 'GET',
          path: '/email/info',
          description: 'Get information about the example application',
        },
      },
      exampleUsage: {
        sendAllTemplates:
          'curl -X POST http://localhost:3000/email/send-all-templates -H "Content-Type: application/json" -d \'{"email": "test@example.com"}\'',
        testAllEngines:
          'curl -X POST http://localhost:3000/email/test-all-engines -H "Content-Type: application/json" -d \'{"email": "test@example.com"}\'',
        sendWelcome:
          'curl -X POST http://localhost:3000/email/welcome -H "Content-Type: application/json" -d \'{"email": "test@example.com", "name": "John Doe"}\'',
        sendSingle:
          'curl -X POST http://localhost:3000/email/order-shipped-advanced -H "Content-Type: application/json" -d \'{"email": "test@example.com", "mailer": "smtp"}\'',
        note: 'All emails now include attachments1.pdf. Use test-all-engines to test Handlebars, EJS, and Pug templates.',
      },
    };
  }
}
