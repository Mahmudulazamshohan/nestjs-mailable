export const TransportType = {
  SMTP: 'smtp',
  SES: 'ses',
  MAILGUN: 'mailgun',
  RESEND: 'resend',
} as const;

export type TransportType = (typeof TransportType)[keyof typeof TransportType];
