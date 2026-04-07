import { Content } from '../interfaces/mail.interface';
import { createMailServiceMock } from './mail-service.mock';

export interface MockMailRecord {
  id: string;
  content: Content;
  timestamp: Date;
}

export interface MockMailServer {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  reset(): void;
  getSentMails(): MockMailRecord[];
  getLastSentMail(): MockMailRecord | undefined;
  assertSent(predicate?: (mail: MockMailRecord) => boolean): void;
  assertSentCount(expectedCount: number): void;
}

export interface MockSupportConfig {
  autoStart?: boolean;
  sendError?: Error;
  customResponse?: unknown | ((content: Content, sentCount: number) => unknown);
  verifyFailure?: boolean;
}

export interface MockSupport {
  server: MockMailServer;
  transport: jest.Mocked<any>;
  mailService: jest.Mocked<any>;
}

function resolveAddresses(addresses: unknown): string[] {
  if (!addresses) {
    return [];
  }

  if (Array.isArray(addresses)) {
    return addresses
      .map((address) => resolveAddresses(address))
      .flat()
      .filter(Boolean);
  }

  if (typeof addresses === 'string') {
    return [addresses];
  }

  if (typeof addresses === 'object' && addresses && 'address' in addresses) {
    const value = (addresses as { address?: unknown }).address;
    return typeof value === 'string' ? [value] : [];
  }

  return [];
}

/**
 * Creates a mock bundle for test cases.
 * Includes a controllable server state, transport mock, and MailService mock.
 *
 * @example
 * const { mailService, server } = createMailMockSupport();
 * await mailService.to('user@example.com').send({ subject: 'Welcome' });
 * server.assertSentCount(1);
 */
export function createMailMockSupport(config: MockSupportConfig = {}): MockSupport {
  const { autoStart = true, sendError, customResponse, verifyFailure = false } = config;
  const sentMails: MockMailRecord[] = [];
  let serverRunning = autoStart;

  const transport = {
    send: jest.fn().mockImplementation(async (content: Content) => {
      if (!serverRunning) {
        throw new Error('Mock server is not running');
      }

      if (sendError) {
        throw sendError;
      }

      const mail: MockMailRecord = {
        id: `dev-mail-${sentMails.length + 1}`,
        content,
        timestamp: new Date(),
      };
      sentMails.push(mail);

      if (typeof customResponse === 'function') {
        return customResponse(content, sentMails.length);
      }

      if (customResponse !== undefined) {
        return customResponse;
      }

      return {
        messageId: mail.id,
        accepted: resolveAddresses(content.to),
        rejected: [],
        response: '250 Mock OK',
      };
    }),
    verify: jest.fn().mockImplementation(async () => {
      if (verifyFailure) {
        throw new Error('Verification failed');
      }
      return serverRunning;
    }),
    close: jest.fn().mockImplementation(async () => {
      serverRunning = false;
    }),
  } as jest.Mocked<any>;

  const server: MockMailServer = {
    start: () => {
      serverRunning = true;
    },
    stop: () => {
      serverRunning = false;
    },
    isRunning: () => serverRunning,
    reset: () => {
      sentMails.splice(0);
    },
    getSentMails: () => [...sentMails],
    getLastSentMail: () => sentMails[sentMails.length - 1],
    assertSent: (predicate?: (mail: MockMailRecord) => boolean) => {
      const count = predicate ? sentMails.filter(predicate).length : sentMails.length;
      if (count === 0) {
        throw new Error('No mail was sent');
      }
    },
    assertSentCount: (expectedCount: number) => {
      if (sentMails.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} mails to be sent, but ${sentMails.length} were sent`);
      }
    },
  };

  const mailService = createMailServiceMock();
  let draftContent: Partial<Content> = {};

  mailService.to.mockImplementation((address) => {
    draftContent.to = address;
    return mailService;
  });
  mailService.cc.mockImplementation((address) => {
    draftContent.cc = address;
    return mailService;
  });
  mailService.bcc.mockImplementation((address) => {
    draftContent.bcc = address;
    return mailService;
  });
  mailService.from.mockImplementation((address) => {
    draftContent.from = address;
    return mailService;
  });
  mailService.replyTo.mockImplementation((address) => {
    draftContent.replyTo = address;
    return mailService;
  });
  mailService.subject.mockImplementation((value) => {
    draftContent.subject = value;
    return mailService;
  });
  mailService.html.mockImplementation((value) => {
    draftContent.html = value;
    return mailService;
  });
  mailService.text.mockImplementation((value) => {
    draftContent.text = value;
    return mailService;
  });
  mailService.template.mockImplementation((value, context) => {
    draftContent.template = value;
    if (context !== undefined) {
      draftContent.context = context;
    }
    return mailService;
  });

  mailService.send.mockImplementation(async (content: Content = {}) => {
    const payload: Content = { ...draftContent, ...content };
    draftContent = {};
    return transport.send(payload);
  });

  mailService.clearSent.mockImplementation(() => {
    server.reset();
  });
  mailService.getSent.mockImplementation(() => sentMails.map((mail) => mail.content));
  mailService.hasSent.mockImplementation(() => sentMails.length > 0);
  mailService.hasSentTo.mockImplementation((email: string) =>
    sentMails.some((mail) =>
      resolveAddresses(mail.content.to).some((address) => address === email || address.includes(email)),
    ),
  );
  mailService.verifyTransport.mockImplementation(async () => transport.verify());
  mailService.close.mockImplementation(async () => transport.close());
  mailService.fake.mockImplementation(() => ({
    assertSent: (predicate?: (mail: Content) => boolean) => {
      const mails = sentMails.map((mail) => mail.content);
      const count = predicate ? mails.filter(predicate).length : mails.length;
      if (count === 0) {
        throw new Error('No mail was sent');
      }
    },
    assertSentCount: (expectedCount: number) => {
      if (sentMails.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} mails to be sent, but ${sentMails.length} were sent`);
      }
    },
    getSentMails: () => sentMails.map((mail) => mail.content),
  }));

  return {
    server,
    transport,
    mailService,
  };
}
