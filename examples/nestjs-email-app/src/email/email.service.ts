import { Injectable } from '@nestjs/common';
import { MailService } from '../../../../dist';
import { OrderShippedAdvanced, Order } from './mails/order-shipped-advanced.mailable';
import { WelcomeEmail, WelcomeData } from './mails/welcome.mailable';
import { TemplateHelpersTestMailable, TemplateHelpersTestData } from './mails/template-helpers-test.mailable';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly sentEmailsDir = path.join(__dirname, '../../../sent-emails');

  constructor(private readonly mailService: MailService) {
    fs.ensureDirSync(this.sentEmailsDir);
  }

  private async saveEmailForViewer(emailData: any): Promise<void> {
    try {
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const emailPath = path.join(this.sentEmailsDir, `${emailId}.json`);

      const emailRecord = {
        ...emailData,
        timestamp: new Date().toISOString(),
      };

      await fs.writeJson(emailPath, emailRecord, { spaces: 2 });

      try {
        const fetch = (await import('node-fetch')).default;
        await fetch('http://localhost:3002/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailRecord),
        });
      } catch (viewerError) {
        console.log('📧 Email viewer service not available, saved locally only');
      }
    } catch (error) {
      console.error('Failed to save email for viewer:', error);
    }
  }

  async sendWelcomeEmail(email: string, name: string, actionUrl: string, features?: string[]) {
    const welcomeData: WelcomeData = {
      name,
      features,
      actionUrl,
    };

    const welcomeMail = new WelcomeEmail(welcomeData);

    try {
      const result = await this.mailService.to(email).send(welcomeMail);
      return {
        success: true,
        message: 'Welcome email sent successfully!',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send welcome email',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendMailable(email: string, mailable: any) {
    try {
      const result = await this.mailService.to(email).send(mailable);
      return {
        success: true,
        message: 'Email sent successfully!',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendOrderShippedAdvanced(email: string, mailer: 'smtp' | 'ses' = 'smtp') {
    // Mock order data for demonstration
    const order: Order = {
      id: 98765,
      name: 'Premium NestJS Course Collection',
      price: 449.99,
      invoice_number: 'INV-2024-ADV-001',
      customer_email: email,
    };

    const orderShippedMail = new OrderShippedAdvanced(order);

    try {
      // Simplified usage - template engine is auto-detected from configuration
      const result = await this.mailService
        .to(email)
        .cc('sales@yourapp.com')
        .bcc('analytics@yourapp.com')
        .send(orderShippedMail);

      return {
        success: true,
        message: 'Advanced order shipped email sent successfully!',
        mailer,
        result,
        orderDetails: {
          orderId: order.id,
          orderName: order.name,
          orderPrice: order.price,
          invoiceNumber: order.invoice_number,
        },
        features: [
          'Advanced envelope() method',
          'Custom content() with template and data',
          'File attachments() with builders',
          'Custom headers() with Message-ID and references',
          'Simplified fluent API without withEngine()',
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send advanced order shipped email',
        mailer,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async testTemplateHelpers(email: string, testData: TemplateHelpersTestData) {
    try {
      const templateHelpersMailable = new TemplateHelpersTestMailable(testData);

      const result = await this.mailService.to(email).cc('dev@yourapp.com').send(templateHelpersMailable);

      return {
        success: true,
        message: 'Template helpers tested successfully using Mailable class',
        result,
        helpersUsed: [
          `currency(${testData.orderPrice}) -> $${testData.orderPrice.toFixed(2)}`,
          `formatDate(${testData.createdAt.toISOString()}) -> ${testData.createdAt.toLocaleDateString()}`,
          `uppercase("${testData.userName}") -> ${testData.userName.toUpperCase()}`,
        ],
        mailableFeatures: [
          'Advanced envelope() with tags and metadata',
          'Template-specific content() method',
          'File attachments() with builders',
          'Handlebars helper functions integration',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendTestEmail(mailer: 'smtp' | 'ses' = 'smtp') {
    // Mock order data for demonstration
    const order: Order = {
      id: Math.floor(Math.random() * 10000) + 1000,
      name: 'Premium NestJS Mailable Course',
      price: 299.99,
      invoice_number: `INV-TEST-${Date.now()}`,
      customer_email: 'test@example.com',
    };

    const orderShippedMail = new OrderShippedAdvanced(order);

    try {
      // Build the mailable to get the HTML content
      const mailableContent = await orderShippedMail.build();

      // Simplified API - uses configured template engine
      const result = await this.mailService
        .to('test@example.com')
        .cc('test@yourapp.com')
        .bcc('logs@yourapp.com')
        .send(orderShippedMail);

      // Save email content for viewer
      await this.saveEmailForViewer({
        subject: 'Your Order Has Shipped! 📦',
        from: 'noreply@yourapp.com',
        to: 'test@example.com',
        cc: 'test@yourapp.com',
        bcc: 'logs@yourapp.com',
        html: mailableContent.html,
        text: mailableContent.text,
        transport: mailer.toUpperCase(),
        messageId: result?.messageId || `<order.${order.id}@yourapp.com>`,
        templateFile: 'mail/orders/shipped',
        orderData: order,
      });

      return {
        success: true,
        message: '🎉 Test email sent successfully!',
        mailer,
        emailSubject: 'Your Order Has Shipped! 📦',
        templateFile: 'mail/orders/shipped',
        result,
        orderDetails: {
          orderId: order.id,
          orderName: order.name,
          orderPrice: order.price,
          invoiceNumber: order.invoice_number,
        },
        testInfo: {
          timestamp: new Date().toISOString(),
          randomOrderId: order.id,
          note: 'Template engine configured via MailModule.forRoot()',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Failed to send test email',
        mailer,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
