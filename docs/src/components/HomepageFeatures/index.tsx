import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Laravel-Style Mailable Classes',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Build clean, reusable email components with <strong>Mailable classes</strong> inspired by Laravel.
        Organize with <code>envelope()</code>, <code>content()</code>, and <code>attachments()</code>.
        Type-safe and testable for enterprise applications.
      </>
    ),
  },
  {
    title: 'Multiple Transport Providers',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Built-in support for <strong>SMTP</strong>, <strong>AWS SES</strong>, <strong>Mailgun</strong>, <strong>Mailjet</strong>, and <strong>Resend</strong>.
        Switch providers with configuration. Use <code>MailFake</code> for testing environments.
      </>
    ),
  },
  {
    title: 'Template Engine Support',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Design emails with <strong>Handlebars</strong>, <strong>EJS</strong>, <strong>Pug</strong>, or <strong>MJML</strong>.
        Includes partials, helpers, and layouts.
        Fluent API: <code>mailService.to(email).send()</code>
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <Svg className={styles.featureSvg} role="img" />
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <div className={styles.featureDescription}>{description}</div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row" style={{alignItems: 'stretch'}}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
