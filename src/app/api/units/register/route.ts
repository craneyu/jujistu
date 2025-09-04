import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, '單位名稱必填'),
  address: z.string().optional(),
  contactName: z.string().min(1, '聯絡人必填'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入正確的手機號碼'),
  email: z.string().email('請輸入正確的電子郵件'),
  password: z.string().min(6, '密碼至少6個字元')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if email already exists
    const existingUnit = await prisma.registrationUnit.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUnit) {
      return NextResponse.json(
        { error: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create unit
    const unit = await prisma.registrationUnit.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        address: true,
        contactName: true,
        phone: true,
        email: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: unit
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}