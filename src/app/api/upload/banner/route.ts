import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key') as any;
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('banner') as File;

    if (!file) {
      return NextResponse.json(
        { error: '沒有選擇檔案' },
        { status: 400 }
      );
    }

    // 檢查檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支援的檔案格式，請上傳 JPG、PNG 或 GIF 格式' },
        { status: 400 }
      );
    }

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '檔案大小超過 5MB 限制' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 建立上傳目錄
    const uploadDir = path.join(process.cwd(), 'public/uploads/banners');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // 目錄可能已存在，忽略錯誤
    }

    // 生成檔案名稱
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `banner-${timestamp}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // 儲存檔案
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/banners/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json(
      { error: '檔案上傳失敗' },
      { status: 500 }
    );
  }
}