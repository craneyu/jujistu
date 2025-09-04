import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請輸入電子郵件和密碼' },
        { status: 400 }
      );
    }

    // 查找單位
    const unit = await prisma.registrationUnit.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!unit) {
      return NextResponse.json(
        { success: false, error: '找不到此電子郵件對應的單位' },
        { status: 401 }
      );
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, unit.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '密碼錯誤' },
        { status: 401 }
      );
    }

    // 登入成功，返回單位資訊（不包含密碼）
    const { password: _, ...unitData } = unit;

    return NextResponse.json({
      success: true,
      message: '登入成功',
      data: unitData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}