# NestJS Mailable Example App

This is a complete example application demonstrating the usage of nestjs-mailable with different template engines.

## Prerequisites

1. Node.js (version 14 or higher)
2. MailDev for testing emails locally

## Setup

1. Install MailDev globally:
   ```bash
   npm install -g maildev
   ```

2. Start MailDev:
   ```bash
   maildev
   ```

3. Install dependencies:
   ```bash
   cd examples/nestjs-email-app
   npm install
   ```

## Running the Example

1. Start the application:
   ```bash
   npm run start
   ```

2. Open your browser to http://localhost:1080 to view the MailDev interface

3. Send test emails using the API endpoints:
   ```bash
   # Send a test email
   curl -X POST "http://localhost:3000/email/test"
   
   # Send an order shipped email
   curl -X POST "http://localhost:3000/email/order-shipped?email=test@example.com"
   ```

## Using Different Template Engines

The nestjs-mailable package supports multiple template engines:

### Handlebars (Default)
Handlebars is the default template engine with support for helpers and partials.

Example template (`templates/mail/orders/shipped.hbs`):
```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Order Shipped</title>
</head>
<body>
    <h1>Your Order Has Shipped! 📦</h1>
    <p>Hello {{customerEmail}},</p>
    <p>Your order {{orderName}} has been shipped.</p>
    <p><strong>Order ID:</strong> {{orderId}}</p>
    <p><strong>Price:</strong> {{currency orderPrice}}</p>
</body>
</html>
```

### EJS
EJS templates use `<% %>` syntax for embedded JavaScript.

Example template (`templates/mail/orders/shipped.ejs`):
```ejs
<!DOCTYPE html>
<html>
<head>
    <title>Order Shipped</title>
</head>
<body>
    <h1>Your Order Has Shipped! 📦</h1>
    <p>Hello <%= customerEmail %>,</p>
    <p>Your order <%= orderName %> has been shipped.</p>
    <p><strong>Order ID:</strong> <%= orderId %></p>
    <p><strong>Price:</strong> $<%= orderPrice.toFixed(2) %></p>
</body>
</html>
```

### Pug (Jade)
Pug uses indentation-based syntax.

Example template (`templates/mail/orders/shipped.pug`):
```pug
doctype html
html
  head
    title Order Shipped
  body
    h1 Your Order Has Shipped! 📦
    p Hello #{customerEmail},
    p Your order #{orderName} has been shipped.
    p
      strong Order ID:
      |  #{orderId}
    p
      strong Price:
      |  $#{orderPrice}
```

## Configuration

To switch between template engines, update the MailModule configuration in `src/app.module.ts`:

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'localhost',
    port: 1025,
    ignoreTLS: true,
    secure: false,
  },
  from: { 
    address: 'noreply@yourapp.com', 
    name: 'Your App' 
  },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS, // or TEMPLATE_ENGINE.EJS or TEMPLATE_ENGINE.PUG
    directory: path.join(__dirname, './email/templates'),
    // Engine-specific options
  },
})
```

## Template Helpers and Partials

### Handlebars Helpers
Handlebars supports custom helpers for advanced formatting:

```typescript
templates: {
  engine: TEMPLATE_ENGINE.HANDLEBARS,
  directory: path.join(__dirname, './email/templates'),
  options: {
    helpers: {
      currency: (amount: number) => `$${amount.toFixed(2)}`,
      formatDate: (date: Date) => date.toLocaleDateString(),
      uppercase: (str: string) => str.toUpperCase(),
    },
  },
}
```

### Partials
Partials allow you to reuse template components:

```typescript
templates: {
  engine: TEMPLATE_ENGINE.HANDLEBARS,
  directory: path.join(__dirname, './email/templates'),
  partials: {
    header: './partials/header',
    footer: './partials/footer',
  },
}
```

Then use in templates:
```handlebars
{{> header siteName="My App" currentYear=2024}}
<!-- Main content -->
{{> footer siteName="My App" currentYear=2024}}
```

## Advanced Features

### Mailable Classes
Create reusable email classes with advanced mailables:

```typescript
export class OrderShippedAdvanced extends Mailable {
  constructor(public order: Order) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Your Order Has Shipped! 📦`,
      tags: ['shipment'],
      metadata: {
        order_id: this.order.id,
      },
    };
  }

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

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./data/invoice.pdf')
        .as('OrderInvoice.pdf')
        .withMime('application/pdf')
        .build(),
    ];
  }
}
```

### Fluent API
Use the fluent API for simple emails:

```typescript
await this.mailService
  .to('user@example.com')
  .cc('support@company.com')
  .send({
    subject: 'Welcome to our platform!',
    template: 'welcome',
    context: { name: user.name }
  });
```