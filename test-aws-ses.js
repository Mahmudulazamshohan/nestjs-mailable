#!/usr/bin/env node

/**
 * AWS SES Test Script
 *
 * This script tests sending email using real AWS SES credentials.
 *
 * Required Environment Variables:
 * - AWS_ACCESS_KEY_ID: Your AWS access key
 * - AWS_SECRET_ACCESS_KEY: Your AWS secret key
 * - AWS_REGION: AWS region (default: us-east-1)
 * - SES_FROM_EMAIL: Verified sender email address in SES
 *
 * Usage:
 *   AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy AWS_REGION=us-east-1 SES_FROM_EMAIL=verified@domain.com node test-aws-ses.js
 */

const AWS = require('aws-sdk');

// Configuration
const config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'noreply@yourapp.com',
  toEmail: 'mahmudulazamshohan7@gmail.com',
};

// Validate configuration
if (!config.accessKeyId || !config.secretAccessKey) {
  console.error('❌ Error: AWS credentials not provided');
  console.error('\nPlease set the following environment variables:');
  console.error('  AWS_ACCESS_KEY_ID');
  console.error('  AWS_SECRET_ACCESS_KEY');
  console.error('  AWS_REGION (optional, default: us-east-1)');
  console.error('  SES_FROM_EMAIL (verified sender email in SES)');
  console.error('\nExample:');
  console.error('  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy SES_FROM_EMAIL=verified@domain.com node test-aws-ses.js');
  process.exit(1);
}

// Configure AWS SES
const ses = new AWS.SES({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
  apiVersion: '2010-12-01',
});

console.log('🚀 AWS SES Test Script');
console.log('='.repeat(60));
console.log(`📧 From: ${config.fromEmail}`);
console.log(`📬 To: ${config.toEmail}`);
console.log(`🌍 Region: ${config.region}`);
console.log('='.repeat(60));
console.log('');

// Test 1: Verify SES configuration
async function verifySES() {
  console.log('🔍 Step 1: Verifying SES configuration...');
  try {
    const data = await ses.getSendQuota().promise();
    console.log('✅ SES Connection successful!');
    console.log(`   - Max 24h send rate: ${data.Max24HourSend}`);
    console.log(`   - Max send rate: ${data.MaxSendRate} emails/second`);
    console.log(`   - Sent last 24h: ${data.SentLast24Hours}`);
    return true;
  } catch (error) {
    console.error('❌ SES verification failed:', error.message);
    return false;
  }
}

// Test 2: Check verified email addresses
async function checkVerifiedEmails() {
  console.log('\n🔍 Step 2: Checking verified email addresses...');
  try {
    const data = await ses.listVerifiedEmailAddresses().promise();
    console.log('✅ Verified email addresses:');
    if (data.VerifiedEmailAddresses.length === 0) {
      console.log('   ⚠️  No verified email addresses found!');
      console.log('   Please verify your sender email in AWS SES console.');
    } else {
      data.VerifiedEmailAddresses.forEach(email => {
        const isFrom = email === config.fromEmail;
        console.log(`   ${isFrom ? '✓' : '-'} ${email}${isFrom ? ' (will be used as FROM)' : ''}`);
      });
    }
    return data.VerifiedEmailAddresses.includes(config.fromEmail);
  } catch (error) {
    console.error('❌ Failed to check verified emails:', error.message);
    return false;
  }
}

// Test 3: Send test email
async function sendTestEmail() {
  console.log('\n📧 Step 3: Sending test email...');

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
    <h1>🚀 AWS SES Test Email</h1>
    <p>nestjs-mailable Package Test</p>
    <span class="badge">✓ AWS SES Transport</span>
  </div>

  <div class="content">
    <h2>Hello from nestjs-mailable! 👋</h2>

    <p>This is a test email sent using the <strong>nestjs-mailable</strong> package with <strong>AWS SES</strong> transport.</p>

    <div class="info-box">
      <h3>📋 Test Details</h3>
      <ul>
        <li><strong>Transport:</strong> AWS SES (Simple Email Service)</li>
        <li><strong>Region:</strong> ${config.region}</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        <li><strong>Package:</strong> nestjs-mailable</li>
      </ul>
    </div>

    <h3>✨ Features Demonstrated</h3>
    <ul>
      <li>✅ AWS SES integration</li>
      <li>✅ HTML email rendering</li>
      <li>✅ Production-ready email transport</li>
      <li>✅ Verified sender configuration</li>
    </ul>

    <p>If you received this email, your AWS SES configuration is working correctly! 🎉</p>

    <p>For more information, visit the <a href="https://github.com/Mahmudulazamshohan/nestjs-mailable">nestjs-mailable GitHub repository</a>.</p>
  </div>

  <div class="footer">
    <p>This is a test email from nestjs-mailable AWS SES integration test.</p>
    <p>Generated at ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `.trim();

  const params = {
    Source: config.fromEmail,
    Destination: {
      ToAddresses: [config.toEmail],
    },
    Message: {
      Subject: {
        Data: '🚀 AWS SES Test - nestjs-mailable Package',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlContent,
          Charset: 'UTF-8',
        },
        Text: {
          Data: `
AWS SES Test Email
==================

Hello from nestjs-mailable!

This is a test email sent using the nestjs-mailable package with AWS SES transport.

Test Details:
- Transport: AWS SES
- Region: ${config.region}
- Timestamp: ${new Date().toISOString()}
- Package: nestjs-mailable

If you received this email, your AWS SES configuration is working correctly!

For more information, visit: https://github.com/Mahmudulazamshohan/nestjs-mailable
          `.trim(),
          Charset: 'UTF-8',
        },
      },
    },
    Tags: [
      {
        Name: 'Environment',
        Value: 'test',
      },
      {
        Name: 'Package',
        Value: 'nestjs-mailable',
      },
    ],
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('✅ Email sent successfully!');
    console.log(`   - Message ID: ${result.MessageId}`);
    console.log(`   - Request ID: ${result.$response.requestId}`);
    console.log(`   - Recipient: ${config.toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);

    // Provide helpful error messages
    if (error.code === 'MessageRejected') {
      console.error('\n⚠️  Email was rejected. Common reasons:');
      console.error('   - Sender email not verified in SES');
      console.error('   - Account in SES sandbox mode (verify recipient email)');
      console.error('   - Invalid email addresses');
    } else if (error.code === 'InvalidParameterValue') {
      console.error('\n⚠️  Invalid parameter. Check your email addresses and content.');
    } else if (error.code === 'ConfigurationSetDoesNotExist') {
      console.error('\n⚠️  Configuration set not found.');
    }

    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    const sesVerified = await verifySES();
    if (!sesVerified) {
      console.error('\n❌ SES verification failed. Please check your AWS credentials and region.');
      process.exit(1);
    }

    const emailVerified = await checkVerifiedEmails();
    if (!emailVerified) {
      console.warn(`\n⚠️  Warning: From email '${config.fromEmail}' is not verified.`);
      console.warn('The email send may fail. Please verify this email in AWS SES console.');
    }

    const emailSent = await sendTestEmail();

    console.log('\n' + '='.repeat(60));
    if (emailSent) {
      console.log('✅ All tests passed! Email sent successfully.');
      console.log(`\n📬 Please check ${config.toEmail} for the test email.`);
      process.exit(0);
    } else {
      console.log('❌ Email sending failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
