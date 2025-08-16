---
sidebar_position: 5
---

# Templates

Learn how to create beautiful, responsive email templates using various template engines supported by NestJS Mailable.

## Supported Template Engines

NestJS Mailable supports multiple template engines:

- **Handlebars** - Powerful templating with helpers and partials
- **EJS** - Embedded JavaScript templates
- **Pug** - Clean, whitespace-sensitive syntax
- **Markdown** - Simple text-based templates
- **MJML** - Responsive email framework

## Configuration

### Basic Template Configuration

```typescript
import { MailModule } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        // ... other config
        templates: {
          engine: 'handlebars',
          directory: './templates',
          options: {
            partials: './templates/partials',
            helpers: {
              // Custom helpers
              uppercase: (str: string) => str.toUpperCase(),
              formatDate: (date: Date) => date.toLocaleDateString()
            }
          }
        }
      }
    })
  ],
})
export class AppModule {}
```

## Handlebars Templates

### Basic Handlebars Template

**templates/welcome.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #28a745; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{appName}}!</h1>
        </div>
        <div class="content">
            <p>Hello {{userName}},</p>
            <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
            
            {{#if verificationUrl}}
            <p>Please verify your email address by clicking the button below:</p>
            <p>
                <a href="{{verificationUrl}}" class="button">Verify Email</a>
            </p>
            {{/if}}
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
    </div>
</body>
</html>
```

### Using the Template

```typescript
await mailService.send({
  to: { address: user.email, name: user.name },
  subject: 'Welcome to Our Platform!',
  template: 'welcome',
  context: {
    userName: user.name,
    appName: 'My App',
    verificationUrl: 'https://myapp.com/verify?token=abc123'
  }
});
```

### Handlebars Partials

**templates/partials/header.hbs**
```handlebars
<div class="header" style="background: {{headerColor}}; color: white; padding: 20px;">
    <img src="{{logoUrl}}" alt="{{appName}}" style="height: 40px;">
    <h1>{{title}}</h1>
</div>
```

**templates/partials/footer.hbs**
```handlebars
<div class="footer" style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
    <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
    <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
        <a href="{{privacyUrl}}">Privacy Policy</a>
    </p>
</div>
```

**templates/newsletter.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
</head>
<body>
    {{> header title="Weekly Newsletter" headerColor="#007bff"}}
    
    <div class="content">
        <h2>Hello {{subscriberName}}!</h2>
        
        {{#each articles}}
        <div class="article">
            <h3><a href="{{url}}">{{title}}</a></h3>
            <p>{{excerpt}}</p>
            <small>By {{author}} on {{publishDate}}</small>
        </div>
        {{/each}}
    </div>
    
    {{> footer year="2024" unsubscribeUrl="/unsubscribe" privacyUrl="/privacy"}}
</body>
</html>
```

### Custom Handlebars Helpers

```typescript
{
  templates: {
    engine: 'handlebars',
    directory: './templates',
    options: {
      helpers: {
        // Format currency
        currency: (amount: number, currency = 'USD') => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
          }).format(amount);
        },
        
        // Format date
        formatDate: (date: Date, format = 'short') => {
          return new Intl.DateTimeFormat('en-US', {
            dateStyle: format as any
          }).format(new Date(date));
        },
        
        // Conditional helper
        ifEquals: function(arg1: any, arg2: any, options: any) {
          return arg1 === arg2 ? options.fn(this) : options.inverse(this);
        },
        
        // Markdown to HTML
        markdown: (text: string) => {
          // Use your preferred markdown parser
          return marked(text);
        }
      }
    }
  }
}
```

## EJS Templates

### Basic EJS Template

**templates/order-confirmation.ejs**
```ejs
<!DOCTYPE html>
<html>
<head>
    <title>Order Confirmation</title>
    <style>
        /* Your CSS styles */
    </style>
</head>
<body>
    <h1>Order Confirmation #<%= orderNumber %></h1>
    
    <p>Dear <%= customerName %>,</p>
    <p>Thank you for your order! Here are the details:</p>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            <% items.forEach(item => { %>
            <tr>
                <td><%= item.name %></td>
                <td><%= item.quantity %></td>
                <td>$<%= item.price.toFixed(2) %></td>
            </tr>
            <% }); %>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2"><strong>Total:</strong></td>
                <td><strong>$<%= totalAmount.toFixed(2) %></strong></td>
            </tr>
        </tfoot>
    </table>
    
    <% if (trackingNumber) { %>
    <p>Your tracking number is: <strong><%= trackingNumber %></strong></p>
    <% } %>
    
    <p>Estimated delivery: <%= deliveryDate.toDateString() %></p>
</body>
</html>
```

## Pug Templates

### Basic Pug Template

**templates/password-reset.pug**
```pug
doctype html
html
  head
    title Password Reset
    style.
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; }
      .alert { padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; }
      .btn { 
        display: inline-block; 
        padding: 10px 20px; 
        background: #dc3545; 
        color: white; 
        text-decoration: none; 
      }
  body
    .container
      h1 Password Reset Request
      
      p Hello #{userName},
      
      p We received a request to reset your password. If you didn't make this request, please ignore this email.
      
      if resetUrl
        .alert
          p To reset your password, click the button below:
          p
            a.btn(href=resetUrl) Reset Password
          p This link will expire in #{expirationTime}.
      
      p If you're having trouble clicking the button, copy and paste the URL below into your web browser:
      p= resetUrl
      
      p Best regards,
      p The Security Team
```

## MJML Templates

MJML creates responsive emails that work across all email clients.

### Basic MJML Template

**templates/promotional.mjml**
```xml
<mjml>
  <mj-head>
    <mj-title>Special Offer Just for You!</mj-title>
    <mj-preview>Don't miss out on this exclusive deal</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-button background-color="#007bff" color="white" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="white" padding="0">
      <mj-column>
        <mj-image 
          src="{{logoUrl}}" 
          alt="{{appName}}" 
          align="center" 
          width="200px" 
          padding="20px" />
      </mj-column>
    </mj-section>
    
    <mj-section background-color="white">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold" align="center">
          Hello {{customerName}}!
        </mj-text>
        <mj-text font-size="16px" line-height="1.6">
          We have an exclusive offer just for you. Get {{discountPercent}}% off your next purchase!
        </mj-text>
        <mj-button href="{{offerUrl}}" background-color="#28a745">
          Claim Your Discount
        </mj-button>
        <mj-text font-size="12px" color="#666">
          Offer expires on {{expirationDate}}
        </mj-text>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#f8f9fa">
      <mj-column>
        <mj-text align="center" font-size="12px" color="#666">
          © {{year}} {{appName}}. All rights reserved.
        </mj-text>
        <mj-text align="center" font-size="12px">
          <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

## Markdown Templates

Perfect for simple, text-focused emails.

**templates/notification.md**
```markdown
# New Notification

Hello **{{userName}}**,

You have a new notification from {{appName}}:

## {{notificationTitle}}

{{notificationContent}}

---

### Action Required

{{#if actionUrl}}
[Take Action]({{actionUrl}})
{{/if}}

{{#if actionDeadline}}
**Deadline:** {{actionDeadline}}
{{/if}}

---

Best regards,  
The {{appName}} Team

---

*This is an automated message. Please do not reply to this email.*

[Unsubscribe]({{unsubscribeUrl}}) | [Privacy Policy]({{privacyUrl}})
```

## Template Organization

### Directory Structure

```
templates/
├── layouts/
│   ├── base.hbs
│   └── minimal.hbs
├── partials/
│   ├── header.hbs
│   ├── footer.hbs
│   └── social-links.hbs
├── emails/
│   ├── auth/
│   │   ├── welcome.hbs
│   │   ├── verify-email.hbs
│   │   └── password-reset.hbs
│   ├── orders/
│   │   ├── confirmation.hbs
│   │   ├── shipped.hbs
│   │   └── delivered.hbs
│   └── marketing/
│       ├── newsletter.hbs
│       ├── promotion.hbs
│       └── survey.hbs
└── styles/
    ├── base.css
    └── responsive.css
```

### Base Layout Template

**templates/layouts/base.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}} - {{appName}}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote { 
            -webkit-text-size-adjust: 100%; 
            -ms-text-size-adjust: 100%; 
        }
        
        /* Base styles */
        body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
            background-color: #f4f4f4; 
        }
        
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white; 
        }
        
        /* Responsive styles */
        @media screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        {{> header}}
        
        <div class="content">
            {{{body}}}
        </div>
        
        {{> footer}}
    </div>
</body>
</html>
```

## Dynamic Template Selection

### Context-Based Template Selection

```typescript
export class NotificationMail extends Mailable {
  constructor(
    private notification: Notification,
    private user: User
  ) {
    super();
  }

  protected build() {
    const template = this.selectTemplate();
    
    this.subject(this.notification.title)
      .view(template, {
        userName: this.user.name,
        notificationTitle: this.notification.title,
        notificationContent: this.notification.content,
        priority: this.notification.priority
      })
      .tag('notification')
      .tag(this.notification.type);

    return this.content;
  }

  private selectTemplate(): string {
    switch (this.notification.type) {
      case 'urgent':
        return 'emails/notifications/urgent';
      case 'reminder':
        return 'emails/notifications/reminder';
      case 'update':
        return 'emails/notifications/update';
      default:
        return 'emails/notifications/default';
    }
  }
}
```

## Internationalization (i18n)

### Multi-language Templates

```typescript
export class WelcomeMail extends Mailable {
  constructor(
    private user: User,
    private locale: string = 'en'
  ) {
    super();
  }

  protected build() {
    const template = `emails/welcome/${this.locale}`;
    
    this.subject(this.getLocalizedSubject())
      .view(template, {
        userName: this.user.name,
        appName: this.getLocalizedAppName()
      });

    return this.content;
  }

  private getLocalizedSubject(): string {
    const subjects = {
      en: `Welcome ${this.user.name}!`,
      es: `¡Bienvenido ${this.user.name}!`,
      fr: `Bienvenue ${this.user.name}!`,
      de: `Willkommen ${this.user.name}!`
    };
    return subjects[this.locale] || subjects.en;
  }
}
```

## Best Practices

### 1. Keep Templates Responsive
Always include mobile-responsive CSS and test across different email clients.

### 2. Use Semantic HTML
Structure your emails with proper HTML semantics for better accessibility.

### 3. Inline Critical CSS
Email clients have limited CSS support, so inline critical styles.

### 4. Test Across Clients
Test your templates in major email clients (Gmail, Outlook, Apple Mail, etc.).

### 5. Optimize Images
- Use absolute URLs for images
- Include alt text
- Optimize file sizes
- Provide fallbacks for blocked images

### 6. Include Plain Text Version
Always provide a plain text alternative for better deliverability:

```typescript
await mailService.send({
  to: { address: user.email },
  subject: 'Welcome!',
  template: 'welcome',
  context: { userName: user.name },
  // Automatically generate plain text from HTML
  generateTextFromHtml: true
});
```