import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '$2b$10$wjlPGSEkGRN7LpdMgaAYrO2YCz6jgXginThRvZG8nwVsdtovrvpOa'; // 預設密碼: admin123

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 檢查使用者名稱
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: '使用者名稱或密碼錯誤' },
        { status: 401 }
      );
    }

    // 檢查密碼
    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '使用者名稱或密碼錯誤' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'your-jwt-secret-key',
      { expiresIn: '8h' }
    );

    return NextResponse.json({
      success: true,
      token,
      message: '登入成功'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}