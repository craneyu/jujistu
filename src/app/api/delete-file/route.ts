import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const athleteId = searchParams.get('athleteId');
    const fileType = searchParams.get('type'); // photo, coachCertificate, consentForm

    if (!filename || !athleteId || !fileType) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      await unlink(filePath);
    } catch (err) {
      console.warn('Failed to delete file from filesystem:', err);
      // Continue even if file deletion fails - maybe file doesn't exist
    }

    // Update database to remove file reference
    const { prisma } = await import('@/lib/prisma');
    
    const updateData: any = {};
    updateData[fileType] = null;
    
    await prisma.athlete.update({
      where: { id: athleteId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: '檔案已成功刪除'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { error: '檔案刪除失敗' },
      { status: 500 }
    );
  }
}