const { SMTPServer } = require('smtp-server');
const fs = require('fs');
const path = require('path');

// Create a simple SMTP server to mock SES
const server = new SMTPServer({
  // Accept any credentials
  authOptional: true,
  
  // Disable authentication for simplicity
  onAuth(auth, session, callback) {
    // Accept any credentials
    callback(null, { user: auth.username });
  },
  
  // Handle incoming emails
  onData(stream, session, callback) {
    let emailContent = '';
    
    stream.on('data', chunk => {
      emailContent += chunk;
    });
    
    stream.on('end', () => {
      console.log('\n=== MOCK SES EMAIL RECEIVED ===');
      console.log('From:', session.envelope.mailFrom);
      console.log('To:', session.envelope.rcptTo);
      console.log('Timestamp:', new Date().toISOString());
      console.log('--- Email Content ---');
      console.log(emailContent);
      console.log('========================\n');
      
      // Save email to a file for inspection
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mock-email-${timestamp}.txt`;
      const filepath = path.join(__dirname, 'mock-emails', filename);
      
      // Create mock-emails directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, 'mock-emails'))) {
        fs.mkdirSync(path.join(__dirname, 'mock-emails'));
      }
      
      fs.writeFileSync(filepath, `
MOCK SES EMAIL
==============
From: ${JSON.stringify(session.envelope.mailFrom)}
To: ${JSON.stringify(session.envelope.rcptTo)}
Timestamp: ${new Date().toISOString()}

EMAIL CONTENT:
${emailContent}
      `);
      
      console.log(`Email saved to: ${filepath}`);
      
      callback(null, 'Message queued successfully');
    });
  },
  
  // Log connection events
  onConnect(session, callback) {
    console.log(`\nMock SES Server: Client connected from ${session.remoteAddress}`);
    callback();
  }
});

// Start the server on port 1025 (common for mock SMTP servers)
server.listen(1025, 'localhost', () => {
  console.log('Mock SES SMTP Server running on localhost:1025');
  console.log('You can send emails to this server for testing');
  console.log('Emails will be displayed in this console and saved to ./mock-emails/');
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock SES server...');
  server.close(() => {
    console.log('Mock SES server stopped');
    process.exit(0);
  });
});