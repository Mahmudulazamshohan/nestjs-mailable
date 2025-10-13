import {
  Mailable,
  AttachmentBuilder,
  MailableEnvelope,
  MailableContent,
  MailableHeaders,
  MailableAttachment,
} from '../../../../../dist';

// Order interface for demonstration
export interface Order {
  id: number;
  name: string;
  price: number;
  invoice_number: string;
  customer_email: string;
}

export class OrderShippedAdvanced extends Mailable {
  constructor(public order: Order) {
    super();
  }

  /**
   * Define the message envelope: subject, tags, metadata
   */
  envelope(): MailableEnvelope {
    return {
      subject: `Your Order Has Shipped!`,
      tags: ['shipment'],
      metadata: {
        order_id: this.order.id,
      },
      using: [
        (message: any) => {
          // Add low-level customizations
          message.headers['X-Mailer'] = 'NestJS-Mailable/1.x';
        },
      ],
    };
  }

  /**
   * Define the content: template and data
   */
  content(): MailableContent {
    return {
      template: 'mail/orders/shipped',
      with: {
        orderId: this.order.id,
        orderName: this.order.name,
        orderPrice: this.order.price,
        invoiceNumber: this.order.invoice_number,
        customerEmail: this.order.customer_email,
      },
    };
  }

  /**
   * Add custom headers: Message-ID, references, etc.
   */
  headers(): MailableHeaders {
    return {
      messageId: `<order.${this.order.id}@yourapp.com>`,
      references: ['<order-confirmation@yourapp.com>'],
      text: {
        'X-Custom-Order-Header': 'OrderShippedAdvanced',
      },
    };
  }

  /**
   * Attach files: PDF attachment from the data directory
   */
  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./data/attachments1.pdf').as('Order_Invoice.pdf').withMime('application/pdf').build(),
    ];
  }
}
