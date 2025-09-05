import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFromName', 'smtpFromEmail']
        }
      }
    });

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Check if all required SMTP settings are present
    if (!configMap.smtpHost || !configMap.smtpPort || !configMap.smtpUser || 
        !configMap.smtpPassword || !configMap.smtpFromName || !configMap.smtpFromEmail) {
      return null;
    }

    return {
      smtpHost: configMap.smtpHost,
      smtpPort: configMap.smtpPort,
      smtpUser: configMap.smtpUser,
      smtpPassword: configMap.smtpPassword,
      smtpFromName: configMap.smtpFromName,
      smtpFromEmail: configMap.smtpFromEmail
    };
  } catch (error) {
    console.error('Error getting email config:', error);
    return null;
  }
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  try {
    const config = await getEmailConfig();
    
    if (!config) {
      console.error('SMTP configuration not found or incomplete');
      return false;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: parseInt(config.smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback to plain text
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendForgotPasswordEmail(email: string, resetToken: string, competitionName?: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>密碼重設</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .token-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${competitionName || '柔術報名系統'}</h2>
          <h3>密碼重設申請</h3>
        </div>
        <div class="content">
          <p>您好，</p>
          <p>我們收到了您的密碼重設申請。請使用以下重設權杖來重設您的密碼：</p>
          
          <div class="token-box">
            <strong>重設權杖：</strong><br>
            ${resetToken}
          </div>
          
          <p>請前往 <a href="${resetUrl}">報名系統</a> 並點擊「忘記密碼？」，然後輸入上述權杖來重設您的密碼。</p>
          
          <p><strong>注意事項：</strong></p>
          <ul>
            <li>此權杖將在1小時後過期</li>
            <li>請勿將此權杖分享給其他人</li>
            <li>如果您沒有申請密碼重設，請忽略此郵件</li>
          </ul>
          
          <p>如有任何問題，請聯繫我們。</p>
          <p>謝謝！</p>
        </div>
        <div class="footer">
          <p>此郵件由系統自動發送，請勿回覆。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `${competitionName || '柔術報名系統'} - 密碼重設`,
    html
  });
}

export async function sendWelcomeEmail(email: string, unitName: string, competitionName?: string): Promise<boolean> {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>歡迎加入</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e9ecef; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .success-box { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${competitionName || '柔術報名系統'}</h2>
          <h3>歡迎加入！</h3>
        </div>
        <div class="content">
          <p>親愛的 ${unitName}，</p>
          
          <div class="success-box">
            <strong>🎉 註冊成功！</strong><br>
            您的單位帳號已成功建立完成。
          </div>
          
          <p>您現在可以使用註冊時的電子郵件地址和密碼登入系統，開始進行選手報名：</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="btn">前往登入</a>
          </div>
          
          <p><strong>下一步：</strong></p>
          <ul>
            <li>登入系統後，請先完善單位資料</li>
            <li>新增選手資訊並上傳相關文件</li>
            <li>選擇參賽項目並完成報名</li>
            <li>確認報名後進行繳費</li>
          </ul>
          
          <p>如果您忘記密碼，可以在登入頁面點擊「忘記密碼？」來重設密碼。</p>
          
          <p>如有任何問題，請隨時聯繫我們。</p>
          <p>祝比賽順利！</p>
        </div>
        <div class="footer">
          <p>此郵件由系統自動發送，請勿回覆。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `歡迎加入 ${competitionName || '柔術報名系統'}`,
    html
  });
}