import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/?auth=cancelled', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?auth=error', request.url));
    }

    // 取得Google OAuth設定
    const googleAuthConfig = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['googleAuthEnabled', 'googleClientId', 'googleClientSecret']
        }
      }
    });

    const configMap = googleAuthConfig.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    if (configMap.googleAuthEnabled !== 'true' || !configMap.googleClientId || !configMap.googleClientSecret) {
      return NextResponse.redirect(new URL('/?auth=disabled', request.url));
    }

    // 建立OAuth2客戶端
    const oauth2Client = new google.auth.OAuth2(
      configMap.googleClientId,
      configMap.googleClientSecret,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`
    );

    // 交換授權碼換取存取權杖
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 取得使用者資訊
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      return NextResponse.redirect(new URL('/?auth=no-email', request.url));
    }

    // 檢查是否已經存在相同email的單位
    let unit = await prisma.registrationUnit.findUnique({
      where: { email: userInfo.email },
      select: {
        id: true,
        name: true,
        address: true,
        contactName: true,
        phone: true,
        email: true
      }
    });

    if (!unit) {
      // 如果不存在，創建新的單位
      // 生成一個隨機密碼（使用者可以通過忘記密碼來重設）
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      unit = await prisma.registrationUnit.create({
        data: {
          name: userInfo.name || `Google使用者 (${userInfo.email})`,
          contactName: userInfo.name || '未設定',
          phone: '', // Google API通常不提供電話號碼
          email: userInfo.email,
          password: hashedPassword,
          address: ''
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
    }

    // 建立用戶session並重定向到首頁
    const sessionData = {
      unitId: unit.id,
      unit: unit
    };

    // 創建一個帶有session資料的重定向URL
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('session', encodeURIComponent(JSON.stringify(sessionData)));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?auth=callback-error', request.url));
  }
}