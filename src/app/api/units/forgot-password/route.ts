import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendForgotPasswordEmail } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('請輸入正確的電子郵件')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body);
    const { email } = validatedData;
    
    // Check if unit exists
    const unit = await prisma.registrationUnit.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!unit) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: '如果此電子郵件存在於系統中，您將收到密碼重設說明'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token expires in 1 hour
    
    // Save reset token to database
    await prisma.registrationUnit.update({
      where: { id: unit.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });
    
    // Get competition name for email
    const competitionNameConfig = await prisma.systemConfig.findUnique({
      where: { key: 'competitionName' }
    });
    const competitionName = competitionNameConfig?.value || '柔術報名系統';
    
    // Send password reset email
    const emailSent = await sendForgotPasswordEmail(email, resetToken, competitionName);
    
    if (emailSent) {
      console.log(`Password reset email sent to ${email}`);
      return NextResponse.json({
        success: true,
        message: '密碼重設說明已發送至您的電子郵件'
      });
    } else {
      console.log(`Failed to send email, showing token for ${email}: ${resetToken}`);
      // Fallback: return token if email fails (for demo/development)
      return NextResponse.json({
        success: true,
        message: '郵件發送失敗，請使用以下重設權杖',
        resetToken: resetToken
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: '處理請求失敗，請稍後再試' },
      { status: 500 }
    );
  }
}