import { Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// 1. EJS Template Mailable
class EjsTemplateMailable extends Mailable {
  constructor(private readonly user: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('EJS Template Example')
      .view('user-notification.ejs', this.user)
      .with('timestamp', new Date().toISOString());
    return super.build();
  }
}

// 2. Handlebars Template Mailable
class HandlebarsTemplateMailable extends Mailable {
  constructor(private readonly orderData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Order Confirmation - {{orderId}}')
      .view('order-confirmation.hbs', this.orderData)
      .with('supportEmail', 'support@example.com');
    return super.build();
  }
}

// 3. Pug Template Mailable
class PugTemplateMailable extends Mailable {
  constructor(private readonly newsletterData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Monthly Newsletter')
      .view('newsletter.pug', this.newsletterData)
      .with('unsubscribeUrl', 'https://example.com/unsubscribe');
    return super.build();
  }
}

// 4. Inline Template Mailable
class InlineTemplateMailable extends Mailable {
  constructor(private readonly data: any) {
    super();
    this.build();
  }

  protected build() {
    const htmlTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1 style="color: #333;">Hello {{ name }}!</h1>
          <p>Your account status: <strong>{{ status }}</strong></p>
          <p>Generated at: {{ timestamp }}</p>
        </body>
      </html>
    `;

    this.subject('Account Status Update').with(this.data).with('timestamp', new Date().toLocaleString());

    this.content.html = htmlTemplate;
    return super.build();
  }
}

// 5. Template Service
@Injectable()
class TemplateService {
  constructor(private readonly mailService: MailService) {}

  async sendEjsEmail() {
    const user = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      preferences: ['tech', 'startups'],
    };

    const mailable = new EjsTemplateMailable(user);
    const sender = await this.mailService.to(user.email);
    return await sender.send(mailable);
  }

  async sendHandlebarsEmail() {
    const order = {
      orderId: 'ORD-12345',
      customerName: 'Bob Smith',
      items: [
        { name: 'Product A', price: 29.99, quantity: 2 },
        { name: 'Product B', price: 15.5, quantity: 1 },
      ],
      total: 75.48,
    };

    const mailable = new HandlebarsTemplateMailable(order);
    const sender = await this.mailService.to('bob@example.com');
    return await sender.send(mailable);
  }

  async sendPugEmail() {
    const newsletter = {
      title: 'Tech Weekly #42',
      articles: [
        { title: 'AI Breakthrough', url: 'https://example.com/ai' },
        { title: 'New Framework Release', url: 'https://example.com/framework' },
      ],
      subscriber: 'tech-enthusiast@example.com',
    };

    const mailable = new PugTemplateMailable(newsletter);
    const sender = await this.mailService.to(newsletter.subscriber);
    return await sender.send(mailable);
  }

  async sendInlineTemplateEmail() {
    const data = {
      name: 'Charlie Brown',
      status: 'Active',
    };

    const mailable = new InlineTemplateMailable(data);
    const sender = await this.mailService.to('charlie@example.com');
    return await sender.send(mailable);
  }

  async sendWithMultipleTemplateEngines() {
    // Demonstrate using different template engines in sequence
    try {
      console.log('Sending EJS template email...');
      await this.sendEjsEmail();
      console.log('✓ EJS email sent');

      console.log('Sending Handlebars template email...');
      await this.sendHandlebarsEmail();
      console.log('✓ Handlebars email sent');

      console.log('Sending Pug template email...');
      await this.sendPugEmail();
      console.log('✓ Pug email sent');

      console.log('Sending inline template email...');
      await this.sendInlineTemplateEmail();
      console.log('✓ Inline template email sent');
    } catch (error) {
      console.error('Template email error:', error);
    }
  }
}

// 6. Module Setup with Template Configuration
@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-app-password',
            },
          },
        },
        from: {
          address: 'templates@example.com',
          name: 'Template Examples',
        },
      },
    }),
  ],
  providers: [TemplateService],
})
class TemplateModule {}

// 7. Template Example Runner
async function templateExample() {
  const app = await NestFactory.create(TemplateModule);
  const templateService = app.get(TemplateService);

  try {
    console.log('=== Template Engine Examples ===');
    await templateService.sendWithMultipleTemplateEngines();
    console.log('✓ All template examples completed successfully!');
  } catch (error) {
    console.error('✗ Template example error:', error.message);
  }

  await app.close();
}

// Export for testing
export {
  templateExample,
  EjsTemplateMailable,
  HandlebarsTemplateMailable,
  PugTemplateMailable,
  InlineTemplateMailable,
  TemplateService,
  TemplateModule,
};

// Run if called directly
if (require.main === module) {
  templateExample();
}
