import { NextRequest, NextResponse } from 'next/server';
// 見 ../route.ts 的說明：改用輕量的 google-auth-library，避免 googleapis
// 把整包 API 定義帶進 serverless function。
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { getAppOrigin, getGoogleRedirectUri } from '@/lib/app-url';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // 導向一律以對外網址為基底。request.url 在 Container Apps 內是容器的
    // 內部位址（Next.js 綁 0.0.0.0:3000），直接拿來組網址會把使用者導到
    // http://0.0.0.0:3000 而連不上。
    const origin = getAppOrigin(request);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/?auth=cancelled', origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?auth=error', origin));
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
      return NextResponse.redirect(new URL('/?auth=disabled', origin));
    }

    // 建立OAuth2客戶端
    const oauth2Client = new OAuth2Client(
      configMap.googleClientId,
      configMap.googleClientSecret,
      getGoogleRedirectUri(request)
    );

    // 交換授權碼換取存取權杖
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 取得使用者資訊。原本用 googleapis 的 oauth2.userinfo.get()，
    // 這裡直接呼叫同一個 endpoint，避免為了一次請求載入整包 googleapis。
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!userInfoResponse.ok) {
      console.error('取得 Google 使用者資訊失敗:', userInfoResponse.status);
      return NextResponse.redirect(new URL('/?auth=callback-error', origin));
    }

    const userInfo: { email?: string; name?: string } = await userInfoResponse.json();

    if (!userInfo.email) {
      return NextResponse.redirect(new URL('/?auth=no-email', origin));
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
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('session', encodeURIComponent(JSON.stringify(sessionData)));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?auth=callback-error', origin));
  }
}