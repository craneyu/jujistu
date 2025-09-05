import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// 生成Google OAuth URL
export async function GET(request: NextRequest) {
  try {
    // 檢查Google OAuth是否啟用
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
      return NextResponse.json(
        { error: 'Google OAuth2登入未啟用或設定不完整' },
        { status: 400 }
      );
    }

    // 建立OAuth2客戶端
    const oauth2Client = new google.auth.OAuth2(
      configMap.googleClientId,
      configMap.googleClientSecret,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`
    );

    // 生成授權URL
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    });

    return NextResponse.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Google OAuth初始化失敗' },
      { status: 500 }
    );
  }
}