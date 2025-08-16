---
sidebar_position: 3
---

# Mailable Classes

Mailable classes provide a clean, testable way to compose emails in your NestJS application using proven object-oriented design patterns.

## Creating Your First Mailable

### Basic Mailable Class

```typescript
import { Mailable } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  protected build() {
    this.subject(`Welcome ${this.user.name}!`)
      .from('welcome@yourapp.com', 'Welcome Team')
      .view('emails/welcome', { 
        userName: this.user.name,
        appName: 'Your App'
      })
      .tag('welcome')
      .tag('onboarding');

    return this.content;
  }
}
```

### Using the Mailable

```typescript
@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async registerUser(userData: CreateUserDto) {
    const user = await this.createUser(userData);
    
    // Create and send the mailable
    const welcomeMail = new WelcomeMail(user);
    await this.mailService.send(welcomeMail);
  }
}
```

## Advanced Mailable Examples

### Order Confirmation Email

```typescript
import { Mailable } from 'nestjs-mailable';

export class OrderConfirmationMail extends Mailable {
  constructor(
    private order: Order,
    private customer: Customer
  ) {
    super();
  }

  protected build() {
    return this
      .to({ address: this.customer.email, name: this.customer.name })
      .subject(`Order Confirmation #${this.order.number}`)
      .view('emails.orders.confirmation', {
        customerName: this.customer.name,
        orderNumber: this.order.number,
        orderDate: this.order.createdAt,
        items: this.order.items,
        subtotal: this.order.subtotal,
        tax: this.order.tax,
        total: this.order.total,
        shippingAddress: this.order.shippingAddress,
        estimatedDelivery: this.calculateDeliveryDate()
      })
      .attach(this.generateInvoicePdf())
      .tag('order')
      .tag('confirmation')
      .metadata({
        orderId: this.order.id,
        customerId: this.customer.id
      });
  }

  private calculateDeliveryDate(): Date {
    const deliveryDays = this.customer.isPremium ? 1 : 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    return deliveryDate;
  }

  private generateInvoicePdf(): string {
    // Generate PDF logic here
    return `/tmp/invoice-${this.order.number}.pdf`;
  }
}
```

### Password Reset Email

```typescript
export class PasswordResetMail extends Mailable {
  constructor(
    private user: User,
    private resetToken: string,
    private expiresAt: Date
  ) {
    super();
  }

  protected build() {
    const resetUrl = `https://yourapp.com/reset-password?token=${this.resetToken}`;
    
    return this
      .to(this.user.email)
      .subject('Reset Your Password')
      .view('emails.auth.password-reset', {
        userName: this.user.name,
        resetUrl,
        expiresAt: this.expiresAt,
        expiresIn: this.getExpirationTime()
      })
      .tag('password-reset')
      .tag('security')
      .header('X-Priority', '1'); // High priority
  }

  private getExpirationTime(): string {
    const now = new Date();
    const diffMs = this.expiresAt.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hours`;
  }
}
```

### Newsletter with Dynamic Content

```typescript
export class NewsletterMail extends Mailable {
  constructor(
    private subscriber: Subscriber,
    private articles: Article[],
    private edition: string
  ) {
    super();
  }

  protected build() {
    return this
      .to({ address: this.subscriber.email, name: this.subscriber.name })
      .subject(`📰 Weekly Newsletter - ${this.edition}`)
      .view('emails.newsletter.weekly', {
        subscriberName: this.subscriber.name,
        edition: this.edition,
        articles: this.articles.map(article => ({
          title: article.title,
          excerpt: article.excerpt,
          author: article.author.name,
          publishedAt: article.publishedAt,
          readTime: article.readTime,
          url: `https://yourapp.com/articles/${article.slug}`,
          imageUrl: article.featuredImage
        })),
        unsubscribeUrl: `https://yourapp.com/unsubscribe?token=${this.subscriber.unsubscribeToken}`
      })
      .tag('newsletter')
      .tag('marketing')
      .header('List-Unsubscribe', `<https://yourapp.com/unsubscribe?token=${this.subscriber.unsubscribeToken}>`)
      .metadata({
        subscriberId: this.subscriber.id,
        edition: this.edition,
        articleCount: this.articles.length
      });
  }
}
```

### Multi-language Support

```typescript
export class WelcomeInternationalMail extends Mailable {
  constructor(
    private user: User,
    private locale: string = 'en'
  ) {
    super();
  }

  protected build() {
    const templateName = `emails.welcome.${this.locale}`;
    const subject = this.getLocalizedSubject();
    
    return this
      .to({ address: this.user.email, name: this.user.name })
      .subject(subject)
      .view(templateName, {
        userName: this.user.name,
        appName: this.getAppName(),
        supportEmail: this.getSupportEmail(),
        locale: this.locale
      })
      .tag('welcome')
      .tag(`locale-${this.locale}`)
      .header('Content-Language', this.locale);
  }

  private getLocalizedSubject(): string {
    const subjects = {
      'en': `Welcome ${this.user.name}!`,
      'es': `¡Bienvenido ${this.user.name}!`,
      'fr': `Bienvenue ${this.user.name}!`,
      'de': `Willkommen ${this.user.name}!`
    };
    
    return subjects[this.locale] || subjects['en'];
  }

  private getAppName(): string {
    const names = {
      'en': 'Your App',
      'es': 'Tu Aplicación',
      'fr': 'Votre Application',
      'de': 'Ihre App'
    };
    
    return names[this.locale] || names['en'];
  }

  private getSupportEmail(): string {
    return `support-${this.locale}@yourapp.com`;
  }
}
```

## Testing Mailables

### Unit Testing with Jest

```typescript
describe('OrderConfirmationMail', () => {
  let order: Order;
  let customer: Customer;

  beforeEach(() => {
    order = {
      id: '123',
      number: 'ORD-001',
      total: 99.99,
      items: [{ name: 'Product 1', price: 99.99 }]
    } as Order;

    customer = {
      id: '456',
      email: 'customer@example.com',
      name: 'John Doe',
      isPremium: false
    } as Customer;
  });

  it('should build order confirmation email correctly', () => {
    const mailable = new OrderConfirmationMail(order, customer);
    const content = mailable.render();

    expect(content.subject).toBe('Order Confirmation #ORD-001');
    expect(content.template).toBe('emails.orders.confirmation');
    expect(content.context.customerName).toBe('John Doe');
    expect(content.context.orderNumber).toBe('ORD-001');
    expect(content.tags).toContain('order');
    expect(content.tags).toContain('confirmation');
  });

  it('should include invoice attachment', () => {
    const mailable = new OrderConfirmationMail(order, customer);
    const content = mailable.render();

    expect(content.attachments).toHaveLength(1);
    expect(content.attachments[0]).toContain('invoice-ORD-001.pdf');
  });

  it('should calculate delivery date for premium customers', () => {
    customer.isPremium = true;
    const mailable = new OrderConfirmationMail(order, customer);
    const content = mailable.render();

    const deliveryDate = new Date(content.context.estimatedDelivery);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 1);

    expect(deliveryDate.toDateString()).toBe(expectedDate.toDateString());
  });
});
```

### Integration Testing

```typescript
describe('Mailable Integration', () => {
  let mailService: MailService;
  let mailFake: MailFake;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [MailModule.forRoot({ /* test config */ })],
      providers: [
        {
          provide: MailService,
          useClass: MailFake
        }
      ]
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailFake = mailService as MailFake;
  });

  it('should send order confirmation email', async () => {
    const order = createTestOrder();
    const customer = createTestCustomer();
    
    const mailable = new OrderConfirmationMail(order, customer);
    await mailService.send(mailable);

    mailFake.assertSent(OrderConfirmationMail, (mail) => {
      return mail.hasTo(customer.email) && 
             mail.hasSubject(`Order Confirmation #${order.number}`);
    });

    expect(mailFake.getSentCount()).toBe(1);
  });
});
    });
  }
}
```

## Mailable Methods

### Content Methods

**Subject**
```typescript
protected build() {
  this.subject('Your Order Confirmation')
    .subject(`Welcome ${this.user.name}!`) // Dynamic subject
}
```

**From Address**
```typescript
protected build() {
  this.from('noreply@yourapp.com')
    .from('support@yourapp.com', 'Support Team') // With name
}
```

**Reply-To**
```typescript
protected build() {
  this.replyTo('support@yourapp.com')
    .replyTo('support@yourapp.com', 'Support Team') // With name
}
```

### Templates and Context

**View Template**
```typescript
protected build() {
  this.view('emails/welcome', {
    userName: this.user.name,
    companyName: 'Your Company',
    verificationUrl: this.generateVerificationUrl()
  });
}
```

**Adding Context Data**
```typescript
protected build() {
  this.view('emails/order-confirmation')
    .with('user', this.user)
    .with('order', this.order)
    .with('totalAmount', this.calculateTotal())
    .with({
      companyName: 'Your Company',
      supportEmail: 'support@yourapp.com'
    });
}
```

### Attachments

**File Attachments**
```typescript
protected build() {
  this.attach('/path/to/invoice.pdf', {
    filename: 'invoice.pdf',
    contentType: 'application/pdf'
  });
}
```

**Data Attachments**
```typescript
protected build() {
  const csvData = this.generateCsvReport();
  this.attachData(csvData, 'report.csv', {
    contentType: 'text/csv'
  });
}
```

### Metadata and Tracking

**Tags**
```typescript
protected build() {
  this.tag('welcome')
    .tag('onboarding')
    .tag('user-registration');
}
```

**Metadata**
```typescript
protected build() {
  this.metadata('user_id', this.user.id)
    .metadata('campaign_id', 'welcome-2024')
    .metadata('source', 'web-registration');
}
```

**Custom Headers**
```typescript
protected build() {
  this.header('X-Priority', 'high')
    .header('X-Campaign-ID', 'summer-sale-2024')
    .header('List-Unsubscribe', 'https://yourapp.com/unsubscribe');
}
```

## Advanced Mailable Examples

### Order Confirmation Email

```typescript
export class OrderConfirmationMail extends Mailable {
  constructor(
    private order: Order,
    private user: User,
    private invoice?: Buffer
  ) {
    super();
  }

  protected build() {
    this.subject(`Order Confirmation #${this.order.id}`)
      .from('orders@yourstore.com', 'Your Store')
      .replyTo('support@yourstore.com', 'Customer Support')
      .view('emails/order-confirmation', {
        orderNumber: this.order.id,
        customerName: this.user.name,
        items: this.order.items,
        totalAmount: this.order.totalAmount,
        shippingAddress: this.order.shippingAddress,
        estimatedDelivery: this.calculateDeliveryDate()
      })
      .tag('order')
      .tag('confirmation')
      .metadata('order_id', this.order.id)
      .metadata('customer_id', this.user.id)
      .metadata('order_total', this.order.totalAmount);

    // Attach invoice if provided
    if (this.invoice) {
      this.attachData(this.invoice, `invoice-${this.order.id}.pdf`, {
        contentType: 'application/pdf'
      });
    }

    return this.content;
  }

  private calculateDeliveryDate(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return deliveryDate.toLocaleDateString();
  }
}
```

### Password Reset Email

```typescript
export class PasswordResetMail extends Mailable {
  constructor(
    private user: User,
    private resetToken: string,
    private expiresAt: Date
  ) {
    super();
  }

  protected build() {
    this.subject('Password Reset Request')
      .from('security@yourapp.com', 'Security Team')
      .view('emails/password-reset', {
        userName: this.user.name,
        resetUrl: this.buildResetUrl(),
        expiresIn: this.getExpirationTime(),
        supportEmail: 'support@yourapp.com'
      })
      .tag('security')
      .tag('password-reset')
      .metadata('user_id', this.user.id)
      .metadata('reset_token', this.resetToken)
      .header('X-Priority', 'high');

    return this.content;
  }

  private buildResetUrl(): string {
    return `https://yourapp.com/reset-password?token=${this.resetToken}`;
  }

  private getExpirationTime(): string {
    const now = new Date();
    const diffMs = this.expiresAt.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    return `${diffMins} minutes`;
  }
}
```

### Newsletter with Dynamic Content

```typescript
export class NewsletterMail extends Mailable {
  constructor(
    private subscriber: Subscriber,
    private articles: Article[],
    private personalizedContent: PersonalizedContent
  ) {
    super();
  }

  protected build() {
    this.subject(this.getPersonalizedSubject())
      .from('newsletter@yourapp.com', 'Your App Newsletter')
      .view('emails/newsletter', {
        subscriberName: this.subscriber.name,
        featuredArticles: this.getFeaturedArticles(),
        personalizedRecommendations: this.personalizedContent.recommendations,
        unsubscribeUrl: this.buildUnsubscribeUrl(),
        webVersion: this.buildWebVersionUrl()
      })
      .tag('newsletter')
      .tag('marketing')
      .tag(this.personalizedContent.segment)
      .metadata('subscriber_id', this.subscriber.id)
      .metadata('newsletter_id', this.personalizedContent.newsletterId)
      .metadata('segment', this.personalizedContent.segment)
      .header('List-Unsubscribe', this.buildUnsubscribeUrl())
      .header('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');

    return this.content;
  }

  private getPersonalizedSubject(): string {
    const subjects = [
      `${this.subscriber.name}, your weekly digest is here!`,
      `New articles just for you, ${this.subscriber.name}`,
      `Don't miss this week's top stories, ${this.subscriber.name}`
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  private getFeaturedArticles(): Article[] {
    return this.articles.slice(0, 3);
  }

  private buildUnsubscribeUrl(): string {
    return `https://yourapp.com/unsubscribe?token=${this.subscriber.unsubscribeToken}`;
  }

  private buildWebVersionUrl(): string {
    return `https://yourapp.com/newsletter/${this.personalizedContent.newsletterId}`;
  }
}
```

## Testing Mailables

### Unit Testing

```typescript
describe('WelcomeMail', () => {
  it('should build welcome email correctly', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    const welcomeMail = new WelcomeMail(user);
    const content = welcomeMail.render();

    expect(content.subject).toBe('Welcome John Doe!');
    expect(content.template).toBe('emails/welcome');
    expect(content.context?.userName).toBe('John Doe');
    expect(content.tags).toContain('welcome');
    expect(content.tags).toContain('onboarding');
  });
});
```

### Integration Testing

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, MailService],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  it('should send welcome email after user registration', async () => {
    const fake = mailService.fake();
    const userData = { name: 'John Doe', email: 'john@example.com' };

    await userService.registerUser(userData);

    fake.assertSentCount(1);
    fake.assertSent((mail) => mail.subject === 'Welcome John Doe!');
    fake.assertSent((mail) => mail.tags?.includes('welcome'));
  });
});
```

## Best Practices

### 1. Keep Mailables Focused
Each Mailable should handle one type of email with a single responsibility.

### 2. Use Dependency Injection
```typescript
export class OrderConfirmationMail extends Mailable {
  constructor(
    private order: Order,
    private user: User,
    @Inject('APP_CONFIG') private config: AppConfig
  ) {
    super();
  }
}
```

### 3. Extract Complex Logic
```typescript
export class OrderConfirmationMail extends Mailable {
  constructor(
    private order: Order,
    private user: User,
    private orderCalculator: OrderCalculatorService
  ) {
    super();
  }

  protected build() {
    this.subject(`Order Confirmation #${this.order.id}`)
      .view('emails/order-confirmation', {
        ...this.buildOrderContext(),
        ...this.buildUserContext()
      });

    return this.content;
  }

  private buildOrderContext() {
    return {
      orderNumber: this.order.id,
      items: this.order.items,
      subtotal: this.orderCalculator.calculateSubtotal(this.order),
      taxes: this.orderCalculator.calculateTaxes(this.order),
      total: this.orderCalculator.calculateTotal(this.order)
    };
  }

  private buildUserContext() {
    return {
      customerName: this.user.name,
      customerEmail: this.user.email,
      loyaltyPoints: this.user.loyaltyPoints
    };
  }
}
```

### 4. Use TypeScript Interfaces
```typescript
interface OrderEmailData {
  order: Order;
  user: User;
  calculatedTotals: {
    subtotal: number;
    taxes: number;
    total: number;
  };
}

export class OrderConfirmationMail extends Mailable {
  constructor(private data: OrderEmailData) {
    super();
  }
}
```