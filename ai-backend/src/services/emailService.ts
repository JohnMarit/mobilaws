import nodemailer from 'nodemailer';
import { env } from '../env';

// Create email transporter
const createTransporter = () => {
  // For development, use Ethereal Email (temporary test accounts)
  // For production, use your email service (Gmail, SendGrid, etc.)
  
  if (env.NODE_ENV === 'production' && env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }
  
  // Development mode - use console logging
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  } as any);
};

interface SendMagicLinkParams {
  email: string;
  token: string;
  type: 'admin' | 'user';
}

export async function sendMagicLink({ email, token, type }: SendMagicLinkParams): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    // Determine the verification URL based on type
    const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = type === 'admin' 
      ? `${baseUrl}/admin/verify?token=${token}`
      : `${baseUrl}/verify?token=${token}`;
    
    const subject = type === 'admin' 
      ? 'Admin Login - Mobilaws' 
      : 'Sign in to Mobilaws';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              padding: 40px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .content {
              color: #4b5563;
              margin-bottom: 30px;
            }
            .button {
              display: inline-block;
              background: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 6px;
              font-weight: 600;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background: #1d4ed8;
            }
            .link-container {
              text-align: center;
              margin: 30px 0;
            }
            .alt-link {
              color: #6b7280;
              font-size: 14px;
              margin-top: 20px;
            }
            .alt-link a {
              color: #2563eb;
              word-break: break-all;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
              text-align: center;
            }
            .security-note {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .security-note strong {
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏛️ Mobilaws</div>
              <div class="title">${type === 'admin' ? 'Admin' : ''} Sign In Request</div>
            </div>
            
            <div class="content">
              <p>Hello,</p>
              <p>You requested to sign in to your ${type === 'admin' ? 'admin' : ''} account. Click the button below to securely sign in:</p>
            </div>
            
            <div class="link-container">
              <a href="${verifyUrl}" class="button">
                🔐 Sign In to Mobilaws
              </a>
            </div>
            
            <div class="security-note">
              <strong>⚠️ Security Notice:</strong> This link will expire in 15 minutes and can only be used once.
            </div>
            
            <div class="alt-link">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            </div>
            
            <div class="content">
              <p><strong>Didn't request this?</strong></p>
              <p>If you didn't request this sign-in link, you can safely ignore this email. Your account remains secure.</p>
            </div>
            
            <div class="footer">
              <p>This email was sent to <strong>${email}</strong></p>
              <p>© ${new Date().getFullYear()} Mobilaws - South Sudan Legal System</p>
              <p style="margin-top: 10px; color: #9ca3af; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
Sign in to Mobilaws ${type === 'admin' ? '(Admin)' : ''}

You requested to sign in to your account. Click the link below to securely sign in:

${verifyUrl}

⚠️ Security Notice: This link will expire in 15 minutes and can only be used once.

Didn't request this?
If you didn't request this sign-in link, you can safely ignore this email.

This email was sent to ${email}
© ${new Date().getFullYear()} Mobilaws - South Sudan Legal System
    `.trim();
    
    // In development, log to console
    if (env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 MAGIC LINK EMAIL (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Type: ${type}`);
      console.log('\n🔗 Magic Link:');
      console.log(verifyUrl);
      console.log('\n📝 Token:');
      console.log(token);
      console.log('='.repeat(80) + '\n');
      return true;
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: `"Mobilaws" <${env.EMAIL_FROM || 'noreply@mobilaws.com'}>`,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    console.log(`✅ Magic link email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending magic link email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; background: #2563eb; color: #ffffff; 
                     text-decoration: none; padding: 12px 24px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;
    
    if (env.NODE_ENV === 'development') {
      console.log(`\n📧 Password Reset Email to: ${email}`);
      console.log(`🔗 Reset Link: ${resetUrl}\n`);
      return true;
    }
    
    await transporter.sendMail({
      from: `"Mobilaws" <${env.EMAIL_FROM || 'noreply@mobilaws.com'}>`,
      to: email,
      subject: 'Password Reset - Mobilaws',
      html: htmlContent,
    });
    
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
}
