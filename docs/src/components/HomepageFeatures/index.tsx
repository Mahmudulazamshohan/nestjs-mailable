import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  label: string;
  title: string;
  description: string;
  bullets: string[];
};

const featureList: FeatureItem[] = [
  {
    label: 'Architecture',
    title: 'Class-based mail design',
    description:
      'Organize email logic with dedicated mailable classes and keep transport/template concerns separate from service code.',
    bullets: ['envelope()', 'content()', 'attachments()', 'headers()'],
  },
  {
    label: 'Delivery',
    title: 'Transport flexibility',
    description:
      'Switch between SMTP, SES, Mailgun, and Mailjet through typed configuration without rewriting business workflows.',
    bullets: ['SMTP', 'AWS SES', 'Mailgun', 'Mailjet'],
  },
  {
    label: 'Quality',
    title: 'Testing-first workflow',
    description:
      'Validate email behavior quickly with built-in mocks, fake transports, and test module helpers for unit and integration tests.',
    bullets: ['Mock support', 'Fluent assertions', 'Module helpers', 'Jest friendly'],
  },
];

function FeatureCard({label, title, description, bullets}: FeatureItem): ReactNode {
  return (
    <article className={styles.featureCard}>
      <div className={styles.featureLabel}>{label}</div>
      <Heading as="h3" className={styles.featureTitle}>
        {title}
      </Heading>
      <p className={styles.featureDescription}>{description}</p>
      <ul className={styles.featureList}>
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2">Designed for maintainable email systems</Heading>
          <p>
            This package is built for teams that want clean architecture in code and predictable behavior in production.
          </p>
        </div>

        <div className={styles.grid}>
          {featureList.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
