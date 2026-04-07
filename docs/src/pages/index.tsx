import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

type DocLink = {
  title: string;
  body: string;
  href: string;
};

const docLinks: DocLink[] = [
  {
    title: 'Get Started',
    body: 'Install, configure MailModule, and send your first message in minutes.',
    href: '/docs/intro',
  },
  {
    title: 'Configuration',
    body: 'Set up SMTP, SES, Mailgun, or Mailjet using strongly typed transport options.',
    href: '/docs/configuration',
  },
  {
    title: 'Mailables',
    body: 'Create reusable class-based emails with envelope, content, attachments, and headers.',
    href: '/docs/mailables',
  },
  {
    title: 'Testing',
    body: 'Use the built-in mocks and helper utilities to test mail behavior with confidence.',
    href: '/docs/testing',
  },
];

function HeroSection(): ReactNode {
  return (
    <section className={styles.hero}>
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>NestJS Email Toolkit</div>
          <Heading as="h1" className={styles.heroTitle}>
            Build dependable email flows for production NestJS apps.
          </Heading>
          <p className={styles.heroSubtitle}>
            `nestjs-mailable` gives you class-based mailables, template engines, transport switching,
            retries, events, and testing utilities in one cohesive developer experience.
          </p>

          <div className={styles.actions}>
            <Link className={clsx('button button--primary button--lg', styles.primaryAction)} to="/docs/intro">
              Read Documentation
            </Link>
            <Link className={clsx('button button--secondary button--lg', styles.secondaryAction)} to="/docs/basic-usage">
              View Quickstart
            </Link>
          </div>

          <div className={styles.transportRow}>
            <span>SMTP</span>
            <span>SES</span>
            <span>Mailgun</span>
            <span>Mailjet</span>
          </div>
        </div>

        <aside className={styles.heroPanel} aria-label="Install nestjs-mailable">
          <p className={styles.panelEyebrow}>Install</p>
          <pre className={styles.installBlock}>
            <code>npm install nestjs-mailable</code>
          </pre>
          <p className={styles.panelText}>Then register `MailModule` and choose your transport in configuration.</p>
          <Link className={styles.panelLink} to="/docs/configuration">
            Open configuration guide
          </Link>
        </aside>
      </div>
    </section>
  );
}

function JumpstartSection(): ReactNode {
  return (
    <section className={styles.jumpstart}>
      <div className="container">
        <div className={styles.jumpstartHeader}>
          <Heading as="h2">Start from the right place</Heading>
          <p>Pick the section that matches your current task.</p>
        </div>

        <div className={styles.jumpstartGrid}>
          {docLinks.map((item) => (
            <Link key={item.href} to={item.href} className={styles.jumpCard}>
              <Heading as="h3">{item.title}</Heading>
              <p>{item.body}</p>
              <span className={styles.jumpCardCta}>Open section</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={`${siteConfig.title} Documentation`}
      description="Modern docs for NestJS Mailable: setup, configuration, templates, mailables, and testing.">
      <HeroSection />
      <HomepageFeatures />
      <JumpstartSection />
    </Layout>
  );
}
