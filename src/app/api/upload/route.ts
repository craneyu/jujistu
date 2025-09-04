import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // photo, coachCertificate, consentForm

    if (!file) {
      return NextResponse.json(
        { error: '沒有選擇檔案' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: '缺少檔案類型' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = {
      photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      coachCertificate: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      consentForm: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
      paymentProof: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    };

    if (!allowedTypes[type as keyof typeof allowedTypes]?.includes(file.type)) {
      return NextResponse.json(
        { error: '檔案格式不支援' },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '檔案大小不能超過10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = path.extname(file.name);
    const filename = `${type}_${uuidv4()}${extension}`;
    
    // Create upload directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${filename}`
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: '檔案上傳失敗' },
      { status: 500 }
    );
  }
}