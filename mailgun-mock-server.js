#!/usr/bin/env node

/**
 * Simple Mailgun Mock Server for testing
 * Mimics Mailgun API responses for email sending
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3001;
const EMAILS_DIR = path.join(__dirname, 'mailgun-emails');

// Ensure emails directory exists
fs.ensureDirSync(EMAILS_DIR);

// Configure multer for handling multipart/form-data (Mailgun uses this format)
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock Mailgun messages endpoint
app.post('/v3/:domain/messages', upload.any(), async (req, res) => {
  try {
    const domain = req.params.domain;
    console.log('📧 Mailgun Mock: Received email request for domain:', domain);

    // Extract email data from form fields
    const emailData = {
      from: req.body.from,
      to: req.body.to,
      cc: req.body.cc,
      bcc: req.body.bcc,
      subject: req.body.subject,
      text: req.body.text,
      html: req.body.html,
      template: req.body.template,
      'h:X-Mailgun-Variables': req.body['h:X-Mailgun-Variables'],
      'o:tracking': req.body['o:tracking'],
      'o:tracking-clicks': req.body['o:tracking-clicks'],
      'o:tracking-opens': req.body['o:tracking-opens'],
    };

    // Handle attachments
    const attachments = req.files || [];
    const attachmentInfo = attachments.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    // Generate a mock message ID (similar to Mailgun format)
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 12)}@${domain}>`;

    console.log('Email details:');
    console.log('- From:', emailData.from);
    console.log('- To:', emailData.to);
    console.log('- Subject:', emailData.subject);
    console.log('- Attachments:', attachmentInfo.length);

    // Save the email for inspection
    const emailId = `mailgun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emailPath = path.join(EMAILS_DIR, `${emailId}.json`);

    const emailRecord = {
      messageId,
      domain,
      service: 'Mailgun Mock',
      transport: 'Mailgun',
      emailData,
      attachments: attachmentInfo,
      timestamp: new Date().toISOString(),
      headers: req.headers,
    };

    await fs.writeJson(emailPath, emailRecord, { spaces: 2 });

    console.log('✅ Mailgun Mock: Email saved with ID:', messageId);

    // Return Mailgun-like response
    res.status(200).json({
      id: messageId,
      message: 'Queued. Thank you.'
    });
  } catch (error) {
    console.error('❌ Mailgun Mock Error:', error);
    res.status(500).json({
      message: 'Email sending failed'
    });
  }
});

// Mock Mailgun domain verification endpoint
app.get('/v3/domains/:domain', (req, res) => {
  const domain = req.params.domain;
  res.json({
    domain: {
      name: domain,
      smtp_login: `postmaster@${domain}`,
      smtp_password: 'mock-password',
      state: 'active',
      wildcard: false,
      spam_action: 'disabled',
      created_at: new Date().toISOString(),
      receiving_dns_records: [],
      sending_dns_records: []
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Mailgun Mock Server',
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
        from: emailData.emailData?.from,
        to: emailData.emailData?.to,
        subject: emailData.emailData?.subject,
      });
    }

    res.json({ emails, count: emails.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read emails' });
  }
});

// Get specific email details
app.get('/emails/:id', async (req, res) => {
  try {
    const emailPath = path.join(EMAILS_DIR, `${req.params.id}.json`);
    const emailData = await fs.readJson(emailPath);
    res.json(emailData);
  } catch (error) {
    res.status(404).json({ error: 'Email not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mailgun Mock Server running on http://localhost:${PORT}`);
  console.log(`📧 Emails will be saved to: ${EMAILS_DIR}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 List emails: http://localhost:${PORT}/emails`);
  console.log(`📬 Send emails via: POST http://localhost:${PORT}/v3/your-domain.com/messages`);
});

module.exports = app;