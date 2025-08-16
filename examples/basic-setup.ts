import { Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// 1. Basic Mailable Class
class WelcomeMailable extends Mailable {
  constructor(private readonly userName: string) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Welcome to Our Platform!')
      .with('name', this.userName)
      .with('greeting', 'Welcome aboard!')
      .with('message', "We're excited to have you join our community.");
    return super.build();
  }
}

// 2. Service with Mail Usage
@Injectable()
class AppService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    const mailable = new WelcomeMailable(userName);

    const sender = await this.mailService.to(userEmail);
    return await sender.send(mailable);
  }

  async sendSimpleEmail() {
    const content = {
      subject: 'Simple Test Email',
      text: 'This is a simple test email',
      html: '<h1>Hello World!</h1><p>This is a simple test email</p>',
    };

    const sender = await this.mailService.to('user@example.com');
    return await sender.send(content);
  }
}

// 3. Module Setup
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
          address: 'noreply@example.com',
          name: 'Example App',
        },
      },
    }),
  ],
  providers: [AppService],
})
class AppModule {}

// 4. Bootstrap and Usage
async function basicExample() {
  const app = await NestFactory.create(AppModule);
  const appService = app.get(AppService);

  try {
    console.log('=== Basic Setup Example ===');

    // Send simple email
    console.log('Sending simple email...');
    await appService.sendSimpleEmail();
    console.log('✓ Simple email sent successfully!');

    // Send mailable email
    console.log('Sending welcome email using Mailable...');
    await appService.sendWelcomeEmail('user@example.com', 'John Doe');
    console.log('✓ Welcome email sent successfully!');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  await app.close();
}

// Export for testing
export { basicExample, WelcomeMailable, AppService, AppModule };

// Run if called directly
if (require.main === module) {
  basicExample();
}
