export const TransportType = {
  SMTP: 'smtp',
  SES: 'ses',
  MAILGUN: 'mailgun',
  MAILJET: 'mailjet',
  RESEND: 'resend',
  POSTMARK: 'postmark',
  SENDGRID: 'sendgrid',
  BREVO: 'brevo',
  FAILOVER: 'failover',
} as const;

export type TransportType = (typeof TransportType)[keyof typeof TransportType];
