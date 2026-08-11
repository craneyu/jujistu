import { NextRequest, NextResponse } from 'next/server';
// 這裡只需要 OAuth2 用戶端。改用 google-auth-library 而非 googleapis：
// `import { google } from 'googleapis'` 會把整包 API 定義（約 182 MB）帶進
// serverless function，很容易超過平台的 function 體積上限；
// google-auth-library 只有不到 1 MB，且已是本專案的相依套件。
import { OAuth2Client } from 'google-auth-library';
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
    const oauth2Client = new OAuth2Client(
      configMap.googleClientId,
      configMap.googleClientSecret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/api/auth/google/callback`
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