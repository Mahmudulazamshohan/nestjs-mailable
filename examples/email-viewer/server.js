const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Directory where sent emails are stored
const EMAILS_DIR = path.join(__dirname, 'sent-emails');

// Ensure emails directory exists
fs.ensureDirSync(EMAILS_DIR);

// API to get list of sent emails
app.get('/api/emails', async (req, res) => {
  try {
    const files = await fs.readdir(EMAILS_DIR);
    const emails = [];
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      const filePath = path.join(EMAILS_DIR, file);
      const emailData = await fs.readJson(filePath);
      emails.push({
        id: file.replace('.json', ''),
        ...emailData,
        timestamp: emailData.timestamp || new Date(fs.statSync(filePath).mtime).toISOString()
      });
    }
    
    // Sort by timestamp descending (newest first)
    emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(emails);
  } catch (error) {
    console.error('Error reading emails:', error);
    res.status(500).json({ error: 'Failed to read emails' });
  }
});

// API to get specific email content
app.get('/api/emails/:id', async (req, res) => {
  try {
    const emailPath = path.join(EMAILS_DIR, `${req.params.id}.json`);
    const emailData = await fs.readJson(emailPath);
    res.json(emailData);
  } catch (error) {
    console.error('Error reading email:', error);
    res.status(404).json({ error: 'Email not found' });
  }
});

// API to save sent email (called by our app)
app.post('/api/emails', async (req, res) => {
  try {
    const emailData = {
      ...req.body,
      timestamp: new Date().toISOString()
    };
    
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const emailPath = path.join(EMAILS_DIR, `${emailId}.json`);
    
    await fs.writeJson(emailPath, emailData, { spaces: 2 });
    
    res.json({ success: true, emailId });
  } catch (error) {
    console.error('Error saving email:', error);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

// API to clear all emails
app.delete('/api/emails', async (req, res) => {
  try {
    await fs.emptyDir(EMAILS_DIR);
    res.json({ success: true, message: 'All emails cleared' });
  } catch (error) {
    console.error('Error clearing emails:', error);
    res.status(500).json({ error: 'Failed to clear emails' });
  }
});

// Serve the email viewer UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NestJS Mailable - Email Viewer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #2d3748; margin-bottom: 10px; }
        .header p { color: #718096; }
        .controls { margin-bottom: 20px; }
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 10px; }
        .btn-primary { background: #4299e1; color: white; }
        .btn-danger { background: #e53e3e; color: white; }
        .btn:hover { opacity: 0.9; }
        .email-list { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
        .email-sidebar { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-height: 80vh; overflow-y: auto; }
        .email-content { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .email-item { padding: 15px; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background 0.2s; }
        .email-item:hover, .email-item.active { background: #f7fafc; }
        .email-item h3 { color: #2d3748; font-size: 16px; margin-bottom: 5px; }
        .email-item p { color: #718096; font-size: 14px; margin-bottom: 3px; }
        .email-item .timestamp { color: #a0aec0; font-size: 12px; }
        .email-preview iframe { width: 100%; height: 600px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .email-meta { background: #f7fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
        .email-meta strong { color: #2d3748; }
        .no-emails { text-align: center; color: #718096; padding: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 NestJS Mailable - Email Viewer</h1>
            <p>View and inspect sent emails from your NestJS application</p>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="refreshEmails()">🔄 Refresh</button>
            <button class="btn btn-danger" onclick="clearEmails()">🗑️ Clear All</button>
        </div>
        
        <div class="email-list">
            <div class="email-sidebar">
                <h3>Sent Emails</h3>
                <div id="emailList">
                    <div class="no-emails">No emails sent yet</div>
                </div>
            </div>
            
            <div class="email-content">
                <div id="emailContent">
                    <div class="no-emails">Select an email to view its content</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let emails = [];
        
        async function loadEmails() {
            try {
                const response = await fetch('/api/emails');
                emails = await response.json();
                renderEmailList();
            } catch (error) {
                console.error('Error loading emails:', error);
            }
        }
        
        function renderEmailList() {
            const listContainer = document.getElementById('emailList');
            
            if (emails.length === 0) {
                listContainer.innerHTML = '<div class="no-emails">No emails sent yet</div>';
                return;
            }
            
            listContainer.innerHTML = emails.map((email, index) => {
                const timestamp = new Date(email.timestamp).toLocaleString();
                return \`
                    <div class="email-item" onclick="selectEmail('\${email.id}', \${index})">
                        <h3>\${email.subject || 'No Subject'}</h3>
                        <p><strong>To:</strong> \${email.to || 'Unknown'}</p>
                        <p><strong>From:</strong> \${email.from || 'Unknown'}</p>
                        <div class="timestamp">\${timestamp}</div>
                    </div>
                \`;
            }).join('');
        }
        
        async function selectEmail(emailId, index) {
            try {
                // Update active state
                document.querySelectorAll('.email-item').forEach((item, i) => {
                    item.classList.toggle('active', i === index);
                });
                
                const response = await fetch(\`/api/emails/\${emailId}\`);
                const email = await response.json();
                
                const contentContainer = document.getElementById('emailContent');
                contentContainer.innerHTML = \`
                    <div class="email-meta">
                        <strong>Subject:</strong> \${email.subject || 'No Subject'}<br>
                        <strong>From:</strong> \${email.from || 'Unknown'}<br>
                        <strong>To:</strong> \${email.to || 'Unknown'}<br>
                        <strong>Timestamp:</strong> \${new Date(email.timestamp).toLocaleString()}<br>
                        \${email.transport ? \`<strong>Transport:</strong> \${email.transport}<br>\` : ''}
                        \${email.messageId ? \`<strong>Message ID:</strong> \${email.messageId}<br>\` : ''}
                    </div>
                    <div class="email-preview">
                        <iframe srcdoc="\${escapeHtml(email.html || email.text || 'No content')}"></iframe>
                    </div>
                \`;
            } catch (error) {
                console.error('Error loading email content:', error);
            }
        }
        
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        async function refreshEmails() {
            await loadEmails();
        }
        
        async function clearEmails() {
            if (confirm('Are you sure you want to clear all emails?')) {
                try {
                    await fetch('/api/emails', { method: 'DELETE' });
                    await loadEmails();
                    document.getElementById('emailContent').innerHTML = 
                        '<div class="no-emails">Select an email to view its content</div>';
                } catch (error) {
                    console.error('Error clearing emails:', error);
                }
            }
        }
        
        // Load emails on page load
        loadEmails();
        
        // Auto-refresh every 5 seconds
        setInterval(loadEmails, 5000);
    </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`📧 Email Viewer running on http://localhost:${PORT}`);
});