#!/usr/bin/env node

/**
 * Simple SES Mock Server for testing
 * Mimics AWS SES API responses for email sending
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 4566;
const EMAILS_DIR = path.join(__dirname, 'sent-emails');

// Ensure emails directory exists
fs.ensureDirSync(EMAILS_DIR);

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/x-amz-json-1.1' }));

// Mock SES SendRawEmail endpoint
app.post('/', async (req, res) => {
  try {
    console.log('📧 SES Mock: Received email request');

    // Parse the raw email content
    const rawEmail = req.body.toString();
    console.log('Raw email data:', rawEmail.substring(0, 200) + '...');

    // Generate a mock message ID
    const messageId = `000${Date.now()}-${Math.random().toString(36).substr(2, 8)}-000000`;

    // Save the raw email for inspection
    const emailId = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emailPath = path.join(EMAILS_DIR, `${emailId}.json`);

    const emailRecord = {
      messageId,
      service: 'SES Mock',
      transport: 'SES',
      rawEmail: rawEmail,
      timestamp: new Date().toISOString(),
      headers: req.headers,
    };

    await fs.writeJson(emailPath, emailRecord, { spaces: 2 });

    console.log('✅ SES Mock: Email saved with ID:', messageId);

    // Return SES-like response
    res.status(200).json({
      MessageId: messageId,
    });
  } catch (error) {
    console.error('❌ SES Mock Error:', error);
    res.status(500).json({
      __type: 'MessageRejected',
      message: 'Email sending failed',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SES Mock Server',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// List sent emails endpoint
app.get('/emails', async (req, res) => {
  try {
    const files = await fs.readdir(EMAILS_DIR);
    const emails = [];

    for (const file of files.filter((f) => f.endsWith('.json'))) {
      const filePath = path.join(EMAILS_DIR, file);
      const emailData = await fs.readJson(filePath);
      emails.push({
        id: file.replace('.json', ''),
        messageId: emailData.messageId,
        timestamp: emailData.timestamp,
        service: emailData.service,
      });
    }

    res.json({ emails, count: emails.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read emails' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SES Mock Server running on http://localhost:${PORT}`);
  console.log(`📧 Emails will be saved to: ${EMAILS_DIR}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 List emails: http://localhost:${PORT}/emails`);
});

module.exports = app;
