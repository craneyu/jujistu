import { NextRequest } from 'next/server';

/**
 * 取得應用程式對外的網址（scheme + host，結尾不含斜線）。
 *
 * 用來組出 Google OAuth 的 redirect_uri。先前寫的是
 * `process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'`，有兩個問題：
 *
 * 1. NEXT_PUBLIC_* 是 build-time 變數，Next.js 會在編譯時把值 inline 進程式碼，
 *    在部署平台設定 runtime 環境變數並不會生效。
 * 2. 因此線上送給 Google 的 redirect_uri 一直是 https://localhost:3000，
 *    Google 會以 redirect_uri_mismatch 拒絕。
 *
 * 改為從請求標頭推導，部署到任何網域都不需要額外設定。
 * Container Apps、Vercel、Netlify 都在應用程式前面有一層反向代理，
 * 因此優先採用 x-forwarded-* 標頭，本機開發時退回 host。
 *
 * 需要強制指定時（例如自訂網域與實際 host 不同），設定 runtime 環境變數
 * APP_URL 覆寫即可——注意不要加 NEXT_PUBLIC_ 前綴，否則又會變成 build-time。
 */
export function getAppOrigin(request: NextRequest): string {
  const override = process.env.APP_URL;
  if (override) return override.replace(/\/+$/, '');

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');

  if (!host) {
    // 理論上不會發生，保留可辨識的值方便除錯
    return 'http://localhost:3000';
  }

  const proto =
    request.headers.get('x-forwarded-proto') ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');

  return `${proto}://${host}`;
}

/** Google OAuth 的 callback 網址，兩支 route 必須完全一致，否則 Google 會拒絕。 */
export function getGoogleRedirectUri(request: NextRequest): string {
  return `${getAppOrigin(request)}/api/auth/google/callback`;
}
