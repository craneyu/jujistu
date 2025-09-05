import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().min(1, '重設權杖為必填'),
  password: z.string().min(6, '新密碼至少6個字元'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: '密碼不相符',
  path: ['confirmPassword']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body);
    const { token, password } = validatedData;
    
    // Find unit with valid reset token
    const unit = await prisma.registrationUnit.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      }
    });
    
    if (!unit) {
      return NextResponse.json(
        { error: '重設權杖無效或已過期' },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    await prisma.registrationUnit.update({
      where: { id: unit.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: '密碼重設成功，請使用新密碼登入'
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: '密碼重設失敗，請稍後再試' },
      { status: 500 }
    );
  }
}