import {
  Mailable,
  AttachmentBuilder,
  MailableEnvelope,
  MailableContent,
  MailableAttachment,
} from '../../../../../dist';

export interface WelcomeData {
  name: string;
  features?: string[];
  actionUrl: string;
}

export class WelcomeEmail extends Mailable {
  constructor(private data: WelcomeData) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Welcome ${this.data.name}!`,
      tags: ['welcome', 'onboarding'],
    };
  }

  content(): MailableContent {
    return {
      template: 'mail/welcome',
      with: {
        name: this.data.name,
        features: this.data.features,
        actionUrl: this.data.actionUrl,
      },
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./data/attachments1.pdf').as('Welcome_Guide.pdf').withMime('application/pdf').build(),
    ];
  }
}
