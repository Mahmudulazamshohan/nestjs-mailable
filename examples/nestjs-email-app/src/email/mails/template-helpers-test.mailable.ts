import {
  Mailable,
  AttachmentBuilder,
  MailableEnvelope,
  MailableContent,
  MailableHeaders,
  MailableAttachment,
} from '../../../../../dist';
import * as path from 'path';

export interface TemplateHelpersTestData {
  customerEmail: string;
  orderId: string;
  orderName: string;
  orderPrice: number;
  invoiceNumber: string;
  createdAt: Date;
  items: Array<{ name: string; price: number }>;
  total: number;
  discount: number;
  userName: string;
  description: string;
}

export class TemplateHelpersTestMailable extends Mailable {
  constructor(private data: TemplateHelpersTestData) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: '🧪 Template Helper Functions Test - NestJS Mailable',
      tags: ['template-test', 'helpers', 'handlebars'],
      metadata: {
        orderId: this.data.orderId,
        testType: 'helper-functions',
        engine: 'handlebars',
      },
    };
  }

  content(): MailableContent {
    return {
      template: 'mail/orders/test-helpers',
      with: {
        customerEmail: this.data.customerEmail,
        orderId: this.data.orderId,
        orderName: this.data.orderName,
        orderPrice: this.data.orderPrice,
        invoiceNumber: this.data.invoiceNumber,
        createdAt: this.data.createdAt,
        items: this.data.items,
        total: this.data.total,
        discount: this.data.discount,
        userName: this.data.userName,
        description: this.data.description,
      },
    };
  }

  headers(): MailableHeaders {
    return {
      messageId: `<helper-test.${this.data.orderId}@yourapp.com>`,
      references: ['<template-helpers@yourapp.com>'],
      text: {
        'X-Template-Helper-Test': 'true',
        'X-Template-Engine': 'handlebars',
      },
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./data/attachments1.pdf')
        .as('helper-test-attachment.pdf')
        .withMime('application/pdf')
        .build(),
    ];
  }
}
