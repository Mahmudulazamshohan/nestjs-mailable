// Example templates for the mail package
export const EXAMPLE_TEMPLATES = {
  welcome: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome {{name}}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #007bff; color: white; padding: 20px; }
        .content { padding: 20px; background: #f8f9fa; }
        .button { 
          display: inline-block; 
          background: #28a745; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to {{appName}}!</h1>
        </div>
        <div class="content">
          <h2>Hello {{name}},</h2>
          <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
          
          {{#if verificationUrl}}
          <p>To get started, please verify your email address by clicking the button below:</p>
          <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
          {{/if}}
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'order-shipped': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Shipped</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #28a745; color: white; padding: 20px; }
        .order-info { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .tracking { background: #fff; border: 2px solid #007bff; padding: 15px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        
        <div class="order-info">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> {{order.id}}</p>
          <p><strong>Customer:</strong> {{customer.name}}</p>
          <p><strong>Shipping Date:</strong> {{formatDate order.shippedAt}}</p>
        </div>
        
        <div class="tracking">
          <h3>Tracking Information</h3>
          <p><strong>Tracking Number:</strong> {{order.tracking}}</p>
          <p>You can track your package using the tracking number above.</p>
        </div>
        
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `,

  'reset-password': `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; background: #dc3545; color: white; padding: 20px; }
        .content { padding: 20px; }
        .button { 
          display: inline-block; 
          background: #dc3545; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 10px 0;
        }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello {{name}},</p>
          <p>You recently requested to reset your password. Click the button below to reset it:</p>
          
          <a href="{{resetUrl}}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>⚠️ Important:</strong> This link will expire in {{expiresIn}} minutes for security reasons.</p>
          </div>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p>Best regards,<br>The Security Team</p>
        </div>
      </div>
    </body>
    </html>
  `,
};
