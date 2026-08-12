import { NextRequest, NextResponse } from 'next/server';

/**
 * 讀取上傳檔案的代理端點。
 *
 * Blob 容器刻意維持私有（infra/main.bicep 的 allowBlobPublicAccess 為 false），
 * 因此不能把 blob 的公開網址直接交給瀏覽器——選手照片、家長同意書、匯款證明
 * 都屬於個資，不應該任何人拿到網址就能存取。
 * 這裡改由應用程式以受控識別讀取後串流回去。
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // 僅允許單層檔名，避免路徑穿越（例如 ../../ 讀到其他 blob）
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: '檔案名稱不合法' }, { status: 400 });
  }

  if (!process.env.AZURE_STORAGE_ACCOUNT_NAME) {
    return NextResponse.json(
      { error: '未設定 Azure 儲存體，本機開發請直接使用 /uploads 路徑' },
      { status: 404 }
    );
  }

  try {
    const { getAzureBlobStorage } = await import('@/lib/azure-storage');
    const blob = await getAzureBlobStorage().downloadFile(filename);

    if (!blob) {
      return NextResponse.json({ error: '找不到檔案' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(blob.buffer), {
      headers: {
        'Content-Type': blob.contentType || 'application/octet-stream',
        // 檔名帶 uuid，內容不會變動，可長期快取；private 避免中介快取共用
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('讀取檔案失敗:', error);
    return NextResponse.json({ error: '讀取檔案失敗' }, { status: 500 });
  }
}
