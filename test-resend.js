#!/usr/bin/env node

const { Resend } = require('resend');

const config = {
  apiKey: 're_AcUwgDHX_8XVRXJivC3VM9Z1dWwZYiL7X',
  fromEmail: 'onboarding@resend.dev',
  toEmail: 'rizwan582@hotmail.com',
};

if (!config.apiKey) {
  console.error('Error: Resend API key not provided');
  process.exit(1);
}

const resend = new Resend(config.apiKey);

console.log('Resend Test Script');
console.log('='.repeat(60));
console.log(`From: ${config.fromEmail}`);
console.log(`To: ${config.toEmail}`);
console.log('='.repeat(60));
console.log('');

async function sendTestEmail() {
  console.log('Sending test email...');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .badge {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      margin-top: 10px;
    }
    .info-box {
      background: white;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Resend Test Email</h1>
    <p>nestjs-mailable Package Test</p>
    <span class="badge">Resend Transport</span>
  </div>

  <div class="content">
    <h2>Hello from nestjs-mailable!</h2>

    <p>This is a test email sent using the <strong>nestjs-mailable</strong> package with <strong>Resend</strong> transport.</p>

    <div class="info-box">
      <h3>Test Details</h3>
      <ul>
        <li><strong>Transport:</strong> Resend API</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        <li><strong>Package:</strong> nestjs-mailable</li>
      </ul>
    </div>

    <h3>Features Demonstrated</h3>
    <ul>
      <li>Resend API integration</li>
      <li>HTML email rendering</li>
      <li>Production-ready email transport</li>
      <li>Simple API key authentication</li>
    </ul>

    <p>If you received this email, your Resend configuration is working correctly!</p>

    <p>For more information, visit the <a href="https://github.com/Mahmudulazamshohan/nestjs-mailable">nestjs-mailable GitHub repository</a>.</p>
  </div>

  <div class="footer">
    <p>This is a test email from nestjs-mailable Resend integration test.</p>
    <p>Generated at ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: config.fromEmail,
      to: config.toEmail,
      subject: 'Resend Test - nestjs-mailable Package',
      html: htmlContent,
      text: `
Resend Test Email
==================

Hello from nestjs-mailable!

This is a test email sent using the nestjs-mailable package with Resend transport.

Test Details:
- Transport: Resend API
- Timestamp: ${new Date().toISOString()}
- Package: nestjs-mailable

If you received this email, your Resend configuration is working correctly!

For more information, visit: https://github.com/Mahmudulazamshohan/nestjs-mailable
      `.trim(),
      tags: [
        { name: 'environment', value: 'test' },
        { name: 'package', value: 'nestjs-mailable' }
      ]
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully!');
    console.log(`   - Email ID: ${data.id}`);
    console.log(`   - Recipient: ${config.toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
}

async function runTest() {
  try {
    const emailSent = await sendTestEmail();

    console.log('\n' + '='.repeat(60));
    if (emailSent) {
      console.log('All tests passed! Email sent successfully.');
      console.log(`\nPlease check ${config.toEmail} for the test email.`);
      process.exit(0);
    } else {
      console.log('Email sending failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  }
}

runTest();
