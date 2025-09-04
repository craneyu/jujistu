import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const eventTypeSchema = z.object({
  key: z.string().min(1, '項目代碼必填'),
  name: z.string().min(1, '項目名稱必填'),
  description: z.string().optional(),
  requiresTeam: z.boolean().default(false),
  enabled: z.boolean().default(true)
});

const eventTypeUpdateSchema = eventTypeSchema.partial().omit({ key: true });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enabled = searchParams.get('enabled');
    
    const eventTypes = await prisma.eventType.findMany({
      where: enabled !== null ? { enabled: enabled === 'true' } : {},
      include: {
        categories: {
          where: { enabled: true },
          orderBy: [
            { ageGroup: 'asc' },
            { gender: 'asc' },
            { weightClass: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: eventTypes
    });
    
  } catch (error) {
    console.error('取得項目類型失敗:', error);
    return NextResponse.json(
      { error: '無法取得項目類型' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('建立項目類型收到資料:', body);
    
    const validatedData = eventTypeSchema.parse(body);
    console.log('驗證後的項目類型資料:', validatedData);
    
    // 檢查項目代碼是否已存在
    const existing = await prisma.eventType.findUnique({
      where: { key: validatedData.key }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: '項目代碼已存在' },
        { status: 400 }
      );
    }
    
    const eventType = await prisma.eventType.create({
      data: validatedData,
      include: {
        categories: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: eventType
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('驗證錯誤:', error.errors);
      return NextResponse.json(
        { error: `驗證錯誤: ${error.errors[0].message}` },
        { status: 400 }
      );
    }
    
    console.error('建立項目類型失敗:', error);
    return NextResponse.json(
      { error: `建立項目類型失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少項目類型ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validatedData = eventTypeUpdateSchema.parse(body);
    
    const eventType = await prisma.eventType.update({
      where: { id },
      data: validatedData,
      include: {
        categories: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: eventType
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `驗證錯誤: ${error.errors[0].message}` },
        { status: 400 }
      );
    }
    
    console.error('更新項目類型失敗:', error);
    return NextResponse.json(
      { error: '更新項目類型失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少項目類型ID' },
        { status: 400 }
      );
    }
    
    // 檢查是否有相關的分類
    const categoriesCount = await prisma.eventCategory.count({
      where: { eventTypeId: id }
    });
    
    if (categoriesCount > 0) {
      return NextResponse.json(
        { error: '無法刪除，此項目類型下還有分類設定' },
        { status: 400 }
      );
    }
    
    await prisma.eventType.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: '項目類型已刪除'
    });
    
  } catch (error) {
    console.error('刪除項目類型失敗:', error);
    return NextResponse.json(
      { error: '刪除項目類型失敗' },
      { status: 500 }
    );
  }
}